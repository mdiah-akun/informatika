"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import type { Bab, Kelas } from "@/types/materi";
import type { Siswa } from "@/types/siswa";
import type { TP } from "@/types/tp";
import type { TpNilai, TpNilaiKolom } from "@/types/tp-nilai";
import { Loader2, Check, Plus, X } from "lucide-react";

type SiswaRingkas = Pick<Siswa, "id" | "nisn" | "nama" | "kelas">;
type Peta = Record<string, string>;

const ROMAN: Record<Kelas, string> = { 7: "VII", 8: "VIII", 9: "IX" };
const kunci = (kolomId: string, siswaId: string) => `${kolomId}|${siswaId}`;

function hariIni(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

function rataRata(angka: number[]): number | null {
  return angka.length === 0 ? null : angka.reduce((a, b) => a + b, 0) / angka.length;
}

export default function AdminCatatNilaiTpClient({
  siswaList,
  babList,
  tpList,
}: {
  siswaList: SiswaRingkas[];
  babList: Bab[];
  tpList: TP[];
}) {
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [rombel, setRombel] = useState("");
  const [tpId, setTpId] = useState("");
  const [kolom, setKolom] = useState<TpNilaiKolom[]>([]);
  const [nilai, setNilai] = useState<Peta>({});
  const [tersimpan, setTersimpan] = useState<Peta>({});
  const [barisAktif, setBarisAktif] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rombelOpsi = Array.from(
    new Set(siswaList.map((s) => s.kelas).filter((r) => r.startsWith(`${ROMAN[kelas]}.`)))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const rombelAktif = rombelOpsi.includes(rombel) ? rombel : (rombelOpsi[0] ?? "");

  const babUrutan = new Map(babList.filter((b) => b.kelas === kelas).map((b) => [b.id, b.urutan]));
  const tpOpsi = tpList
    .filter((t) => babUrutan.has(t.bab_id))
    .sort((a, b) => (babUrutan.get(a.bab_id)! - babUrutan.get(b.bab_id)!) || a.urutan - b.urutan);
  const tpAktif = tpOpsi.find((t) => t.id === tpId) ?? tpOpsi[0] ?? null;

  const siswa = siswaList
    .filter((s) => s.kelas === rombelAktif)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const adaPerubahan = Object.keys({ ...nilai, ...tersimpan }).some((k) => (nilai[k] ?? "") !== (tersimpan[k] ?? ""));

  useEffect(() => {
    if (!rombelAktif || !tpAktif) {
      setKolom([]);
      setNilai({});
      setTersimpan({});
      return;
    }
    const tpIdMuat = tpAktif.id;
    let batal = false;
    async function muat() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: kolomRows, error: kolomErr } = await supabase
        .from("tp_nilai_kolom")
        .select("*")
        .eq("tp_id", tpIdMuat)
        .eq("rombel", rombelAktif)
        .order("urutan", { ascending: true })
        .order("created_at", { ascending: true });
      if (batal) return;
      if (kolomErr) {
        setLoading(false);
        setError(kolomErr.message);
        setKolom([]);
        setNilai({});
        setTersimpan({});
        return;
      }
      const daftar = (kolomRows ?? []) as TpNilaiKolom[];
      const peta: Peta = {};
      if (daftar.length > 0) {
        const { data: nilaiRows, error: nilaiErr } = await supabase
          .from("tp_nilai")
          .select("kolom_id, siswa_id, nilai")
          .in("kolom_id", daftar.map((k) => k.id));
        if (batal) return;
        if (nilaiErr) {
          setLoading(false);
          setError(nilaiErr.message);
          return;
        }
        for (const r of (nilaiRows ?? []) as Pick<TpNilai, "kolom_id" | "siswa_id" | "nilai">[]) {
          peta[kunci(r.kolom_id, r.siswa_id)] = String(Number(r.nilai));
        }
      }
      setKolom(daftar);
      setNilai(peta);
      setTersimpan(peta);
      setLoading(false);
    }
    muat();
    return () => {
      batal = true;
    };
  }, [rombelAktif, tpAktif?.id]);

  function amanBerpindah(): boolean {
    return !adaPerubahan || confirm("Ada nilai yang belum disimpan. Tinggalkan tanpa menyimpan?");
  }

  async function tambahKolom() {
    if (!tpAktif || !rombelAktif) return;
    setAdding(true);
    setError(null);
    const supabase = createClient();
    const urutan = kolom.length > 0 ? Math.max(...kolom.map((k) => k.urutan)) + 1 : 0;
    const { data, error } = await supabase
      .from("tp_nilai_kolom")
      .insert({ tp_id: tpAktif.id, rombel: rombelAktif, tanggal: hariIni(), judul: "", urutan })
      .select()
      .single();
    setAdding(false);
    if (error || !data) {
      setError(error?.message ?? "Gagal menambah kolom.");
      return;
    }
    setKolom((prev) => [...prev, data as TpNilaiKolom]);
  }

  async function simpanHeader(k: TpNilaiKolom, patch: Partial<Pick<TpNilaiKolom, "tanggal" | "judul">>) {
    const supabase = createClient();
    const { error } = await supabase.from("tp_nilai_kolom").update(patch).eq("id", k.id);
    if (error) setError(error.message);
  }

  function ubahHeaderLokal(id: string, patch: Partial<Pick<TpNilaiKolom, "tanggal" | "judul">>) {
    setKolom((prev) => prev.map((k) => (k.id === id ? { ...k, ...patch } : k)));
  }

  async function hapusKolom(k: TpNilaiKolom, urutanTampil: number) {
    const judul = k.judul.trim() ? ` "${k.judul.trim()}"` : "";
    if (!confirm(`Hapus kolom penilaian ke-${urutanTampil}${judul} beserta semua nilainya?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("tp_nilai_kolom").delete().eq("id", k.id);
    if (error) {
      setError(error.message);
      return;
    }
    setKolom((prev) => prev.filter((x) => x.id !== k.id));
    const buang = (p: Peta) => Object.fromEntries(Object.entries(p).filter(([key]) => !key.startsWith(`${k.id}|`)));
    setNilai(buang);
    setTersimpan(buang);
  }

  function ubahNilai(kolomId: string, siswaId: string, teks: string) {
    if (!/^[0-9]{0,3}([.,][0-9]{0,2})?$/.test(teks)) return;
    setSaved(false);
    setNilai((prev) => {
      const next = { ...prev };
      if (teks === "") delete next[kunci(kolomId, siswaId)];
      else next[kunci(kolomId, siswaId)] = teks;
      return next;
    });
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
    const upserts: { kolom_id: string; siswa_id: string; nilai: number }[] = [];
    const hapusPerKolom = new Map<string, string[]>();

    for (const k of new Set([...Object.keys(nilai), ...Object.keys(tersimpan)])) {
      const baru = nilai[k] ?? "";
      if (baru === (tersimpan[k] ?? "")) continue;
      const [kolomId, siswaId] = k.split("|");
      if (baru === "") {
        hapusPerKolom.set(kolomId, [...(hapusPerKolom.get(kolomId) ?? []), siswaId]);
        continue;
      }
      const n = parseNilai(baru);
      if (n === null || Number.isNaN(n) || n < 0 || n > 100) {
        setError(`Nilai "${baru}" tidak valid. Isi angka 0 sampai 100.`);
        return;
      }
      upserts.push({ kolom_id: kolomId, siswa_id: siswaId, nilai: n });
    }

    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    if (upserts.length > 0) {
      const { error } = await supabase.from("tp_nilai").upsert(upserts, { onConflict: "kolom_id,siswa_id" });
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
    }
    for (const [kolomId, ids] of hapusPerKolom) {
      const { error } = await supabase.from("tp_nilai").delete().eq("kolom_id", kolomId).in("siswa_id", ids);
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
    }
    setSaving(false);
    setTersimpan(nilai);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function nilaiSiswa(siswaId: string): number[] {
    const hasil: number[] = [];
    for (const k of kolom) {
      const n = parseNilai(nilai[kunci(k.id, siswaId)] ?? "");
      if (n !== null && !Number.isNaN(n)) hasil.push(n);
    }
    return hasil;
  }

  // Pembagi RATA = jumlah data terbanyak yang terisi pada satu siswa. Berlaku
  // sama untuk semua siswa, termasuk yang belum diisi semua kolomnya.
  const pembagi = Math.max(0, ...siswa.map((s) => nilaiSiswa(s.id).length));

  function rataSiswa(siswaId: string): number | null {
    const angka = nilaiSiswa(siswaId);
    if (angka.length === 0 || pembagi === 0) return null;
    return angka.reduce((a, b) => a + b, 0) / pembagi;
  }

  function nilaiKolom(kolomId: string): number[] {
    const hasil: number[] = [];
    for (const s of siswa) {
      const n = parseNilai(nilai[kunci(kolomId, s.id)] ?? "");
      if (n !== null && !Number.isNaN(n)) hasil.push(n);
    }
    return hasil;
  }

  const th = "border border-slate-300 dark:border-slate-600 px-1.5 py-1 text-center font-medium";
  const td = "border border-slate-300 dark:border-slate-600 text-center";
  const kecil =
    "w-full bg-transparent text-center text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-inset focus:ring-indigo-500";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Catat Nilai TP</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Catat nilai siswa untuk tiap Tujuan Pembelajaran. Tambah kolom penilaian (tanggal dan judul), isi nilainya,
          dan kolom RATA terhitung otomatis. Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-4">
        {KELAS_LIST.map((k) => (
          <button
            key={k}
            onClick={() => {
              if (!amanBerpindah()) return;
              setKelas(k);
              setRombel("");
              setTpId("");
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              kelas === k
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {kelasLabel(k)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
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
          value={tpAktif?.id ?? ""}
          onChange={(e) => {
            if (!amanBerpindah()) return;
            setTpId(e.target.value);
          }}
          disabled={tpOpsi.length === 0}
          className="max-w-xs rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {tpOpsi.length === 0 && <option value="">Belum ada TP</option>}
          {tpOpsi.map((t) => (
            <option key={t.id} value={t.id}>
              {t.kode} - {t.deskripsi.length > 45 ? `${t.deskripsi.slice(0, 45)}...` : t.deskripsi}
            </option>
          ))}
        </select>

        <button
          onClick={tambahKolom}
          disabled={adding || !tpAktif || !rombelAktif}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Tambah Penilaian
        </button>

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
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {tpOpsi.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center text-slate-400 dark:text-slate-500">
          Belum ada TP untuk {kelasLabel(kelas)}. Tambahkan dulu di menu TP.
        </div>
      ) : loading ? (
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
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/40">
                <th rowSpan={3} className={`${th} sticky left-0 z-10 bg-slate-50 dark:bg-slate-700 w-12`}>
                  No
                </th>
                <th rowSpan={3} className={`${th} sticky left-12 z-10 bg-slate-50 dark:bg-slate-700 min-w-[220px]`}>
                  Nama
                </th>
                <th colSpan={Math.max(kolom.length, 1)} className={`${th} h-9 bg-white dark:bg-slate-800`} />
                <th className={`${th} bg-orange-500 text-white dark:bg-orange-600 min-w-[72px]`}>{tpAktif?.kode}</th>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-700/40">
                {kolom.map((k, i) => (
                  <th key={k.id} className={`${th} min-w-[96px] relative group font-normal`}>
                    <input
                      type="date"
                      value={k.tanggal ?? ""}
                      onChange={(e) => {
                        ubahHeaderLokal(k.id, { tanggal: e.target.value || null });
                        simpanHeader(k, { tanggal: e.target.value || null });
                      }}
                      title="Tanggal penilaian"
                      className={`${kecil} text-slate-500 dark:text-slate-400`}
                    />
                    <button
                      onClick={() => hapusKolom(k, i + 1)}
                      title="Hapus kolom penilaian"
                      className="absolute -top-0.5 -right-0.5 hidden group-hover:block rounded-full bg-red-500 text-white p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </th>
                ))}
                {kolom.length === 0 && <th className={`${th} text-slate-400 font-normal text-xs`}>Tgl.</th>}
                <th rowSpan={2} className={`${th} bg-slate-300 dark:bg-slate-600`}>
                  RATA
                </th>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-700/40">
                {kolom.map((k) => (
                  <th key={k.id} className={`${th} font-normal`}>
                    <input
                      value={k.judul}
                      onChange={(e) => ubahHeaderLokal(k.id, { judul: e.target.value })}
                      onBlur={(e) => simpanHeader(k, { judul: e.target.value.trim() })}
                      placeholder="Judul"
                      title="Judul penilaian"
                      className={`${kecil} font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400`}
                    />
                  </th>
                ))}
                {kolom.length === 0 && (
                  <th className={`${th} text-slate-400 font-normal text-xs`}>Klik &quot;Tambah Penilaian&quot;</th>
                )}
              </tr>
            </thead>
            <tbody>
              {siswa.map((s, baris) => {
                const aktif = barisAktif === baris;
                const bgBaris = aktif ? "bg-indigo-100 dark:bg-indigo-500/25" : "bg-white dark:bg-slate-800";
                const rata = rataSiswa(s.id);
                return (
                  <tr key={s.id}>
                    <td className={`${td} sticky left-0 ${bgBaris} text-slate-500 dark:text-slate-400`}>{baris + 1}</td>
                    <td className={`${td} sticky left-12 ${bgBaris} text-left px-2 py-1 font-medium whitespace-nowrap`}>
                      {s.nama}
                    </td>
                    {kolom.map((k, kol) => (
                      <td key={k.id} className={`${td} ${aktif ? "bg-indigo-100 dark:bg-indigo-500/25" : ""}`}>
                        <input
                          data-cell={`${baris}-${kol}`}
                          value={nilai[kunci(k.id, s.id)] ?? ""}
                          onChange={(e) => ubahNilai(k.id, s.id, e.target.value)}
                          onKeyDown={(e) => tekanTombol(e, baris, kol)}
                          onFocus={(e) => {
                            e.target.select();
                            setBarisAktif(baris);
                          }}
                          onBlur={() => setBarisAktif((b) => (b === baris ? null : b))}
                          inputMode="decimal"
                          autoComplete="off"
                          className="w-full min-w-[84px] h-8 text-center bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        />
                      </td>
                    ))}
                    {kolom.length === 0 && <td className={td} />}
                    <td
                      className={`${td} px-2 font-semibold bg-slate-100 dark:bg-slate-700/60 ${
                        aktif ? "!bg-indigo-100 dark:!bg-indigo-500/25" : ""
                      }`}
                    >
                      {rata === null ? "" : formatAngka(rata)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {kolom.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-700/40 font-medium">
                  <td colSpan={2} className={`${td} sticky left-0 bg-slate-50 dark:bg-slate-700 px-2 py-1 text-right`}>
                    Rata-rata kelas
                  </td>
                  {kolom.map((k) => {
                    const r = rataRata(nilaiKolom(k.id));
                    return (
                      <td key={k.id} className={`${td} py-1`}>
                        {r === null ? "" : formatAngka(r)}
                      </td>
                    );
                  })}
                  <td className={`${td} py-1`}>
                    {(() => {
                      const semua = siswa.map((s) => rataSiswa(s.id)).filter((x): x is number => x !== null);
                      const r = rataRata(semua);
                      return r === null ? "" : formatAngka(r);
                    })()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Isi nilai 0 sampai 100 (boleh desimal). RATA = jumlah nilai siswa dibagi jumlah data terbanyak ({pembagi || "-"}),
        jadi sel yang belum diisi tetap ikut dihitung sebagai pembagi. Panah atau Enter untuk pindah sel. Arahkan kursor ke tanggal kolom untuk menghapus kolom.
      </p>
    </div>
  );
}
