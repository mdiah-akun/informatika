"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import type { Kelas } from "@/types/materi";
import type { Siswa } from "@/types/siswa";
import { Loader2, Check, Search } from "lucide-react";

type SiswaRingkas = Pick<Siswa, "id" | "nisn" | "nama" | "kelas">;
type Semester = "Ganjil" | "Genap";
type Jenis = "sts" | "sas";

const INFO_JENIS: Record<Jenis, { judul: string; label: string; nama: string; tabel: string; kolomManual: string }> = {
  sts: { judul: "Nilai STS", label: "STS", nama: "Sumatif Tengah Semester", tabel: "nilai_sts", kolomManual: "pts_manual" },
  sas: { judul: "Nilai SAS", label: "SAS", nama: "Sumatif Akhir Semester", tabel: "nilai_sas", kolomManual: "sas_manual" },
};
type Isi = { pts: string; rem1: string; rem2: string };
type PetaIsi = Record<string, Isi>;
type NilaiRow = { siswa_id: string; rem1: number | null; rem2: number | null; [kolomManual: string]: number | string | null };

const ROMAN: Record<Kelas, string> = { 7: "VII", 8: "VIII", 9: "IX" };
const KOLOM: (keyof Isi)[] = ["pts", "rem1", "rem2"];
const KOSONG: Isi = { pts: "", rem1: "", rem2: "" };

function semesterSaatIni(): Semester {
  return new Date().getMonth() >= 6 ? "Ganjil" : "Genap";
}

function parseNilai(teks: string): number | null {
  const t = teks.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function formatAngka(n: number): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

function teksDariDb(n: number | null): string {
  return n === null ? "" : String(Number(n));
}

/** Nilai Akhir: tanpa remedial = PTS; dengan remedial = nilai terbaik antara
 *  PTS dan remedial, dengan remedial paling tinggi sebesar KKM. */
function hitungAkhir(pts: number | null, rem1: number | null, rem2: number | null, kkm: number): number | null {
  const rem = [rem1, rem2].filter((x): x is number => x !== null);
  if (rem.length === 0) return pts;
  const terbaik = Math.max(...rem);
  return Math.max(pts ?? 0, Math.min(terbaik, kkm));
}

export default function AdminNilaiStsClient({
  jenis,
  siswaList,
  nilaiAuto,
}: {
  jenis: Jenis;
  siswaList: SiswaRingkas[];
  nilaiAuto: Record<string, number>;
}) {
  const info = INFO_JENIS[jenis];
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [rombel, setRombel] = useState("");
  const [semester, setSemester] = useState<Semester>(semesterSaatIni());
  const [cari, setCari] = useState("");
  const [kkmTeks, setKkmTeks] = useState("74");
  const [kkmTersimpan, setKkmTersimpan] = useState(74);
  const [isi, setIsi] = useState<PetaIsi>({});
  const [tersimpan, setTersimpan] = useState<PetaIsi>({});
  const [barisAktif, setBarisAktif] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pakaiAuto, setPakaiAuto] = useState(true);
  const [infoTempel, setInfoTempel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rombelOpsi = Array.from(
    new Set(siswaList.map((s) => s.kelas).filter((r) => r.startsWith(`${ROMAN[kelas]}.`)))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const rombelAktif = rombelOpsi.includes(rombel) ? rombel : (rombelOpsi[0] ?? "");

  const siswa = siswaList
    .filter((s) => s.kelas === rombelAktif)
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const kataCari = cari.trim().toLowerCase();
  const siswaTampil = kataCari ? siswa.filter((s) => s.nama.toLowerCase().includes(kataCari)) : siswa;

  const kkm = Number.isFinite(Number(kkmTeks)) && kkmTeks.trim() !== "" ? Number(kkmTeks) : kkmTersimpan;
  const ada = (peta: PetaIsi, id: string): Isi => peta[id] ?? KOSONG;
  const adaPerubahan = siswa.some((s) =>
    KOLOM.some((k) => ada(isi, s.id)[k] !== ada(tersimpan, s.id)[k])
  );

  const kunciAuto = "nilai-" + jenis + "-auto";

  useEffect(() => {
    try {
      if (localStorage.getItem(kunciAuto) === "0") setPakaiAuto(false);
    } catch {
      // penyimpanan browser tidak tersedia: tetap pakai nilai awal
    }
  }, [kunciAuto]);

  function ubahPakaiAuto(nilai: boolean) {
    setPakaiAuto(nilai);
    try {
      localStorage.setItem(kunciAuto, nilai ? "1" : "0");
    } catch {
      // abaikan
    }
  }

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("nilai_sts_pengaturan")
      .select("kkm")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setKkmTeks(String(data.kkm));
          setKkmTersimpan(data.kkm);
        }
      });
  }, []);

  useEffect(() => {
    if (!rombelAktif) {
      setIsi({});
      setTersimpan({});
      return;
    }
    let batal = false;
    async function muat() {
      setLoading(true);
      setError(null);
      const ids = siswaList.filter((s) => s.kelas === rombelAktif).map((s) => s.id);
      const supabase = createClient();

      const nilaiRes = await supabase
        .from(info.tabel)
        .select(`siswa_id, ${info.kolomManual}, rem1, rem2`)
        .eq("semester", semester)
        .in("siswa_id", ids);
      if (batal) return;
      setLoading(false);
      if (nilaiRes.error) {
        setError(nilaiRes.error.message);
        setIsi({});
        setTersimpan({});
        return;
      }

      const peta: PetaIsi = {};
      for (const r of (nilaiRes.data ?? []) as unknown as NilaiRow[]) {
        peta[r.siswa_id] = {
          pts: teksDariDb(r[info.kolomManual] as number | null),
          rem1: teksDariDb(r.rem1),
          rem2: teksDariDb(r.rem2),
        };
      }
      setIsi(peta);
      setTersimpan(peta);
    }
    muat();
    return () => {
      batal = true;
    };
  }, [rombelAktif, semester, siswaList]);

  function amanBerpindah(): boolean {
    return !adaPerubahan || confirm("Ada nilai yang belum disimpan. Tinggalkan tanpa menyimpan?");
  }

  function ubah(siswaId: string, kolom: keyof Isi, teks: string) {
    if (!/^[0-9]{0,3}([.,][0-9]{0,2})?$/.test(teks)) return;
    setSaved(false);
    setIsi((prev) => ({ ...prev, [siswaId]: { ...ada(prev, siswaId), [kolom]: teks } }));
  }

  async function simpanKkm() {
    const n = Number(kkmTeks);
    if (kkmTeks.trim() === "" || !Number.isInteger(n) || n < 0 || n > 100) {
      setError("KKM harus berupa angka bulat 0 sampai 100.");
      setKkmTeks(String(kkmTersimpan));
      return;
    }
    if (n === kkmTersimpan) return;
    const supabase = createClient();
    const { error } = await supabase.from("nilai_sts_pengaturan").upsert({ id: 1, kkm: n });
    if (error) {
      setError(error.message);
      return;
    }
    setError(null);
    setKkmTersimpan(n);
  }

  // Tempel dari Excel: baris Excel = urutan siswa yang tampil di tabel (ke
  // bawah), kolom Excel = kolom isian ke kanan (Manual, REM.1, REM.2),
  // dimulai dari sel yang sedang aktif.
  function tempel(e: React.ClipboardEvent<HTMLInputElement>, baris: number, kol: number) {
    const NL = String.fromCharCode(10);
    const TAB = String.fromCharCode(9);
    const CR = String.fromCharCode(13);

    const teks = e.clipboardData.getData("text/plain").split(CR).join("");
    const bersih = teks.endsWith(NL) ? teks.slice(0, -1) : teks;
    if (!bersih.includes(NL) && !bersih.includes(TAB)) return;
    e.preventDefault();

    const awalIdx = siswaTampil.findIndex((x) => x.id === siswa[baris]?.id);
    if (awalIdx < 0) return;

    let terisi = 0;
    let dikosongkan = 0;
    let tidakValid = 0;
    let terpotong = 0;
    const perubahan: { id: string; kolom: keyof Isi; teks: string }[] = [];

    bersih.split(NL).forEach((barisTeks, r) => {
      barisTeks.split(TAB).forEach((sel, c) => {
        const tujuan = siswaTampil[awalIdx + r];
        const kolomTujuan = KOLOM[kol + c];
        const mentah = sel.trim().split("%").join("");
        if (!tujuan || !kolomTujuan) {
          if (mentah !== "") terpotong += 1;
          return;
        }
        if (mentah === "") {
          perubahan.push({ id: tujuan.id, kolom: kolomTujuan, teks: "" });
          dikosongkan += 1;
          return;
        }
        const angka = Number(mentah.split(",").join("."));
        if (!Number.isFinite(angka) || angka < 0 || angka > 100) {
          tidakValid += 1;
          return;
        }
        perubahan.push({ id: tujuan.id, kolom: kolomTujuan, teks: String(Math.round(angka * 100) / 100) });
        terisi += 1;
      });
    });

    setSaved(false);
    setIsi((prev) => {
      const next = { ...prev };
      for (const x of perubahan) next[x.id] = { ...ada(next, x.id), [x.kolom]: x.teks };
      return next;
    });

    const bagian = [terisi + " sel terisi"];
    if (dikosongkan > 0) bagian.push(dikosongkan + " dikosongkan");
    if (tidakValid > 0) bagian.push(tidakValid + " dilewati (bukan angka 0-100)");
    if (terpotong > 0) bagian.push(terpotong + " di luar tabel (siswa/kolom kurang)");
    setInfoTempel("Tempel: " + bagian.join(", ") + ". Klik Simpan untuk menyimpan.");
    setTimeout(() => setInfoTempel(null), 8000);
  }

  function pindahFokus(baris: number, kol: number) {
    document.querySelector<HTMLInputElement>(`[data-cell="${baris}-${kol}"]`)?.focus();
  }

  function tekanTombol(e: React.KeyboardEvent<HTMLInputElement>, baris: number, kol: number) {
    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      pindahFokus(baris + 1, kol);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      pindahFokus(baris - 1, kol);
    } else if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
      pindahFokus(baris, kol - 1);
    } else if (e.key === "ArrowRight" && e.currentTarget.selectionEnd === e.currentTarget.value.length) {
      e.preventDefault();
      pindahFokus(baris, kol + 1);
    }
  }

  async function handleSimpan() {
    setError(null);
    const upserts: Record<string, string | number | null>[] = [];
    const hapus: string[] = [];

    for (const s of siswa) {
      const sekarang = ada(isi, s.id);
      if (KOLOM.every((k) => sekarang[k] === ada(tersimpan, s.id)[k])) continue;
      const angka = KOLOM.map((k) => parseNilai(sekarang[k]));
      if (angka.some((n) => n !== null && (Number.isNaN(n) || n < 0 || n > 100))) {
        setError(`Nilai ${s.nama} tidak valid. Isi angka 0 sampai 100.`);
        return;
      }
      if (angka.every((n) => n === null)) hapus.push(s.id);
      else
        upserts.push({
          siswa_id: s.id,
          semester,
          [info.kolomManual]: angka[0],
          rem1: angka[1],
          rem2: angka[2],
          updated_at: new Date().toISOString(),
        });
    }

    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    if (upserts.length > 0) {
      const { error } = await supabase.from(info.tabel).upsert(upserts, { onConflict: "siswa_id,semester" });
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
    }
    if (hapus.length > 0) {
      const { error } = await supabase.from(info.tabel).delete().eq("semester", semester).in("siswa_id", hapus);
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
    }
    setSaving(false);
    setTersimpan(isi);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const th = "border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-medium";
  const td = "border border-slate-300 dark:border-slate-600 text-center";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{info.judul}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Nilai {info.nama}: {info.label} otomatis dari ujian online {jenis.toUpperCase()}, {info.label} manual, dan
          remedial. Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-slate-200 dark:border-slate-700 mb-4">
        {KELAS_LIST.map((k) => (
          <button
            key={k}
            onClick={() => {
              if (!amanBerpindah()) return;
              setKelas(k);
              setRombel("");
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              kelas === k
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {ROMAN[k]}
          </button>
        ))}

        <div className="flex flex-wrap items-center gap-2 sm:ml-2 py-1">
          <select
            value={rombelAktif}
            onChange={(e) => {
              if (!amanBerpindah()) return;
              setRombel(e.target.value);
            }}
            disabled={rombelOpsi.length === 0}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {rombelOpsi.length === 0 && <option value="">Belum ada kelas</option>}
            {rombelOpsi.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={semester}
            onChange={(e) => {
              if (!amanBerpindah()) return;
              setSemester(e.target.value as Semester);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Ganjil">Semester Ganjil</option>
            <option value="Genap">Semester Genap</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={pakaiAuto}
              onChange={(e) => ubahPakaiAuto(e.target.checked)}
              title={"Centang: nilai ujian online " + jenis.toUpperCase() + " ditampilkan dan dipakai. Hapus centang: nilai tersebut dihilangkan."}
              className="h-4 w-4 accent-indigo-600"
            />
            {info.label} Auto
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            KKM
            <input
              value={kkmTeks}
              onChange={(e) => /^\d{0,3}$/.test(e.target.value) && setKkmTeks(e.target.value)}
              onBlur={simpanKkm}
              inputMode="numeric"
              title="KKM: batas nilai remedial"
              className="w-14 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-2 text-center text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        </div>

        <div className="relative w-full sm:w-48 sm:ml-auto py-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama siswa..."
            title="Cari nama siswa"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 pl-9 pr-2 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleSimpan}
          disabled={saving || loading || !adaPerubahan}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          Simpan
        </button>
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Tersimpan.</span>}
        {adaPerubahan && !saved && (
          <span className="text-xs text-amber-600 dark:text-amber-400">Ada nilai belum disimpan</span>
        )}
        {infoTempel && <span className="text-xs text-indigo-600 dark:text-indigo-300">{infoTempel}</span>}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : siswa.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center text-slate-400 dark:text-slate-500">
          Belum ada siswa untuk {kelasLabel(kelas)}.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-auto max-h-[72vh] scroll-samar">
          <table className="border-collapse text-sm text-slate-800 dark:text-slate-200">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 dark:bg-slate-700">
                <th className={`${th} sticky left-0 z-30 bg-slate-50 dark:bg-slate-700 w-12 min-w-[48px]`}>NO</th>
                <th className={`${th} sticky left-12 z-30 bg-slate-50 dark:bg-slate-700 min-w-[240px]`}>NAMA</th>
                <th className={`${th} min-w-[84px]`}>
                  {info.label}
                  <br />
                  <span className="font-normal text-xs">(Auto)</span>
                </th>
                <th className={`${th} min-w-[96px]`}>
                  {info.label}
                  <br />
                  <span className="font-normal text-xs">(Manual)</span>
                </th>
                <th className={`${th} min-w-[84px]`}>REM.1</th>
                <th className={`${th} min-w-[84px]`}>REM.2</th>
                <th className={`${th} min-w-[88px] bg-slate-200 dark:bg-slate-600`}>
                  NILAI
                  <br />
                  AKHIR
                </th>
              </tr>
            </thead>
            <tbody>
              {siswaTampil.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada siswa yang cocok dengan &quot;{cari.trim()}&quot;.
                  </td>
                </tr>
              ) : (
                siswaTampil.map((s) => {
                  const baris = siswa.indexOf(s);
                  const sekarang = ada(isi, s.id);
                  const aktif = barisAktif === s.id;
                  const bg = aktif ? "bg-indigo-100 dark:bg-indigo-500/25" : "";
                  const ptsManual = parseNilai(sekarang.pts);
                  const rem1 = parseNilai(sekarang.rem1);
                  const rem2 = parseNilai(sekarang.rem2);
                  const otomatis = pakaiAuto ? (nilaiAuto[s.id] ?? null) : null;
                  const pts = ptsManual !== null && !Number.isNaN(ptsManual) ? ptsManual : otomatis;
                  const akhir = hitungAkhir(
                    pts,
                    rem1 !== null && !Number.isNaN(rem1) ? rem1 : null,
                    rem2 !== null && !Number.isNaN(rem2) ? rem2 : null,
                    kkm
                  );
                  return (
                    <tr key={s.id}>
                      <td
                        className={`${td} sticky left-0 px-2 text-slate-500 dark:text-slate-400 ${
                          aktif ? bg : "bg-white dark:bg-slate-800"
                        }`}
                      >
                        {baris + 1}
                      </td>
                      <td
                        className={`${td} sticky left-12 text-left px-2 py-1 font-medium whitespace-nowrap ${
                          aktif ? bg : "bg-white dark:bg-slate-800"
                        }`}
                      >
                        {s.nama}
                      </td>
                      <td className={`${td} px-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200`}>
                        {otomatis === null ? "" : formatAngka(otomatis)}
                      </td>
                      {KOLOM.map((k, kol) => {
                        const terisi = sekarang[k] !== "";
                        const remedial = k !== "pts";
                        return (
                          <td
                            key={k}
                            className={`${td} ${
                              remedial && terisi ? "bg-amber-200 dark:bg-amber-500/40" : bg
                            }`}
                          >
                            <input
                              data-cell={`${baris}-${kol}`}
                              value={sekarang[k]}
                              onChange={(e) => ubah(s.id, k, e.target.value)}
                              onKeyDown={(e) => tekanTombol(e, baris, kol)}
                              onPaste={(e) => tempel(e, baris, kol)}
                              onFocus={(e) => {
                                e.target.select();
                                setBarisAktif(s.id);
                              }}
                              onBlur={() => setBarisAktif((b) => (b === s.id ? null : b))}
                              inputMode="decimal"
                              autoComplete="off"
                              className={`w-full min-w-[76px] h-8 text-center bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                                remedial && terisi ? "font-bold" : ""
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td
                        className={`${td} px-2 font-semibold ${
                          aktif ? bg : "bg-slate-100 dark:bg-slate-700/60"
                        }`}
                      >
                        {akhir === null ? "" : formatAngka(akhir)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        {info.label} (Auto) otomatis dari hasil ujian online {jenis.toUpperCase()} (rata-rata ujian pilihan ganda dan
        essai yang sudah dikoreksi); kolom ini tidak bisa diisi. {info.label} yang dipakai = {info.label} (Manual)
        jika diisi, kalau tidak {info.label} (Auto). Nilai Akhir = {info.label} jika tanpa remedial; jika ada
        remedial, nilai terbaik antara {info.label} dan remedial dengan remedial paling tinggi sebesar KKM ({kkm}). REM.2 dipakai jika lebih baik dari REM.1. Panah atau Enter untuk pindah sel. Bisa juga menempel (paste) dari Excel: klik sel pertama lalu Ctrl+V; urutan
        baris harus sama dengan urutan siswa di tabel, dan kolom Excel berurutan Manual, REM.1, REM.2.
      </p>
    </div>
  );
}
