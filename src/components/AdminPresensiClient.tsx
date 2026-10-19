"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import { KODE_PRESENSI, type KodePresensi, type PresensiIsi, type PresensiSesi } from "@/types/presensi";
import type { Siswa } from "@/types/siswa";
import type { Kelas } from "@/types/materi";
import { Loader2, Check, Plus, X } from "lucide-react";

type SiswaRingkas = Pick<Siswa, "id" | "nama" | "kelas">;
type Peta = Record<string, string>;

const ROMAN: Record<Kelas, string> = { 7: "VII", 8: "VIII", 9: "IX" };
const KODE_VALID = KODE_PRESENSI.map((k) => k.kode as string);

const kunci = (sesiId: string, siswaId: string) => `${sesiId}|${siswaId}`;

function hariIni(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function bulanTahun(tgl: string): string {
  return new Date(`${tgl}T00:00:00`)
    .toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    .toUpperCase();
}

function hari(tgl: string): number {
  return new Date(`${tgl}T00:00:00`).getDate();
}

export default function AdminPresensiClient({ siswaList }: { siswaList: SiswaRingkas[] }) {
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [rombel, setRombel] = useState("");
  const [sesi, setSesi] = useState<PresensiSesi[]>([]);
  const [nilai, setNilai] = useState<Peta>({});
  const [tersimpan, setTersimpan] = useState<Peta>({});
  const [bulanBaru, setBulanBaru] = useState(hariIni().slice(0, 7));
  const [hariBaru, setHariBaru] = useState(Number(hariIni().slice(8, 10)));
  const [barisAktif, setBarisAktif] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const [infoTempel, setInfoTempel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rombelOpsi = Array.from(
    new Set(siswaList.map((s) => s.kelas).filter((r) => r.startsWith(`${ROMAN[kelas]}.`)))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const rombelAktif = rombelOpsi.includes(rombel) ? rombel : (rombelOpsi[0] ?? "");
  const siswa = siswaList
    .filter((s) => s.kelas === rombelAktif)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const [tahunBaru, noBulanBaru] = bulanBaru.split("-").map(Number);
  const jumlahHari = bulanBaru ? new Date(tahunBaru, noBulanBaru, 0).getDate() : 31;
  const hariTerpilih = Math.min(hariBaru, jumlahHari);
  const tanggalBaru = bulanBaru ? `${bulanBaru}-${String(hariTerpilih).padStart(2, "0")}` : "";
  const opsiHari = Array.from({ length: jumlahHari }, (_, i) => {
    const d = i + 1;
    const tgl = `${bulanBaru}-${String(d).padStart(2, "0")}`;
    const nama = new Date(`${tgl}T00:00:00`).toLocaleDateString("id-ID", { weekday: "short" });
    return { d, tgl, nama, dipakai: sesi.some((s) => s.tanggal === tgl) };
  });

  const adaPerubahan = Object.keys({ ...nilai, ...tersimpan }).some((k) => (nilai[k] ?? "") !== (tersimpan[k] ?? ""));

  const kelompokBulan: { label: string; jumlah: number }[] = [];
  for (const s of sesi) {
    const label = bulanTahun(s.tanggal);
    const last = kelompokBulan[kelompokBulan.length - 1];
    if (last && last.label === label) last.jumlah += 1;
    else kelompokBulan.push({ label, jumlah: 1 });
  }

  useEffect(() => {
    if (!rombelAktif) {
      setSesi([]);
      setNilai({});
      setTersimpan({});
      return;
    }
    let batal = false;
    async function muat() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: sesiRows, error: sesiErr } = await supabase
        .from("presensi_sesi")
        .select("*")
        .eq("rombel", rombelAktif)
        .order("tanggal", { ascending: true });
      if (batal) return;
      if (sesiErr) {
        setLoading(false);
        setError(sesiErr.message);
        setSesi([]);
        setNilai({});
        setTersimpan({});
        return;
      }
      const daftarSesi = (sesiRows ?? []) as PresensiSesi[];
      const peta: Peta = {};
      if (daftarSesi.length > 0) {
        const { data: isiRows, error: isiErr } = await supabase
          .from("presensi_isi")
          .select("sesi_id, siswa_id, status")
          .in("sesi_id", daftarSesi.map((s) => s.id));
        if (batal) return;
        if (isiErr) {
          setLoading(false);
          setError(isiErr.message);
          return;
        }
        for (const r of (isiRows ?? []) as Pick<PresensiIsi, "sesi_id" | "siswa_id" | "status">[]) {
          peta[kunci(r.sesi_id, r.siswa_id)] = r.status;
        }
      }
      setSesi(daftarSesi);
      setNilai(peta);
      setTersimpan(peta);
      setLoading(false);
    }
    muat();
    return () => {
      batal = true;
    };
  }, [rombelAktif]);

  function amanBerpindah(): boolean {
    return !adaPerubahan || confirm("Ada perubahan yang belum disimpan. Tinggalkan tanpa menyimpan?");
  }

  async function tambahKolom() {
    if (!rombelAktif || !tanggalBaru) return;
    if (sesi.some((s) => s.tanggal === tanggalBaru)) {
      setError("Tanggal itu sudah ada sebagai kolom.");
      return;
    }
    setAdding(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("presensi_sesi")
      .insert({ rombel: rombelAktif, tanggal: tanggalBaru })
      .select()
      .single();
    setAdding(false);
    if (error || !data) {
      setError(error?.message ?? "Gagal menambah kolom.");
      return;
    }
    setSesi((prev) => [...prev, data as PresensiSesi].sort((a, b) => a.tanggal.localeCompare(b.tanggal)));
  }

  async function hapusKolom(s: PresensiSesi, urutan: number) {
    if (!confirm(`Hapus kolom ke-${urutan} (${hari(s.tanggal)} ${bulanTahun(s.tanggal)}) beserta semua isinya?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("presensi_sesi").delete().eq("id", s.id);
    if (error) {
      setError(error.message);
      return;
    }
    setSesi((prev) => prev.filter((x) => x.id !== s.id));
    const buang = (p: Peta) => Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith(`${s.id}|`)));
    setNilai(buang);
    setTersimpan(buang);
  }

  function ubah(sesiId: string, siswaId: string, mentah: string) {
    const v = mentah.trim().toUpperCase().slice(-1);
    if (v && !KODE_VALID.includes(v)) return;
    setSaved(false);
    setNilai((prev) => {
      const next = { ...prev };
      if (v) next[kunci(sesiId, siswaId)] = v;
      else delete next[kunci(sesiId, siswaId)];
      return next;
    });
  }

  // Tempel dari Excel: baris Excel = urutan siswa di tabel (ke bawah), kolom
  // Excel = urutan pertemuan (ke kanan), dimulai dari sel yang sedang aktif.
  function tempel(e: React.ClipboardEvent<HTMLInputElement>, baris: number, kolom: number) {
    const NL = String.fromCharCode(10);
    const TAB = String.fromCharCode(9);
    const CR = String.fromCharCode(13);

    const teks = e.clipboardData.getData("text/plain").split(CR).join("");
    const bersih = teks.endsWith(NL) ? teks.slice(0, -1) : teks;
    if (!bersih.includes(NL) && !bersih.includes(TAB)) return;
    e.preventDefault();

    let terisi = 0;
    let dikosongkan = 0;
    let tidakValid = 0;
    let terpotong = 0;
    const perubahan: Record<string, string> = {};

    bersih.split(NL).forEach((barisTeks, r) => {
      barisTeks.split(TAB).forEach((sel, c) => {
        const b = baris + r;
        const k = kolom + c;
        if (b >= siswa.length || k >= sesi.length) {
          if (sel.trim() !== "") terpotong += 1;
          return;
        }
        const v = sel.trim().toUpperCase();
        if (v !== "" && !KODE_VALID.includes(v)) {
          tidakValid += 1;
          return;
        }
        perubahan[kunci(sesi[k].id, siswa[b].id)] = v;
        if (v === "") dikosongkan += 1;
        else terisi += 1;
      });
    });

    setSaved(false);
    setNilai((prev) => {
      const next = { ...prev };
      for (const [key, v] of Object.entries(perubahan)) {
        if (v === "") delete next[key];
        else next[key] = v;
      }
      return next;
    });

    const bagian = [terisi + " sel terisi"];
    if (dikosongkan > 0) bagian.push(dikosongkan + " dikosongkan");
    if (tidakValid > 0) bagian.push(tidakValid + " dilewati (bukan kode H/S/I/L/M/A/P/G)");
    if (terpotong > 0) bagian.push(terpotong + " di luar tabel (siswa/kolom kurang)");
    setInfoTempel("Tempel: " + bagian.join(", ") + ". Klik Simpan untuk menyimpan.");
    setTimeout(() => setInfoTempel(null), 8000);
  }

  function pindahFokus(baris: number, kolom: number) {
    document.querySelector<HTMLInputElement>(`[data-cell="${baris}-${kolom}"]`)?.focus();
  }

  function tekanTombol(e: React.KeyboardEvent<HTMLInputElement>, baris: number, kolom: number) {
    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      pindahFokus(baris + 1, kolom);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      pindahFokus(baris - 1, kolom);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      pindahFokus(baris, kolom - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      pindahFokus(baris, kolom + 1);
    }
  }

  async function handleSimpan() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const supabase = createClient();

    const upserts: { sesi_id: string; siswa_id: string; status: KodePresensi }[] = [];
    const hapusPerSesi = new Map<string, string[]>();

    for (const k of new Set([...Object.keys(nilai), ...Object.keys(tersimpan)])) {
      const baru = nilai[k] ?? "";
      if (baru === (tersimpan[k] ?? "")) continue;
      const [sesiId, siswaId] = k.split("|");
      if (baru) upserts.push({ sesi_id: sesiId, siswa_id: siswaId, status: baru as KodePresensi });
      else hapusPerSesi.set(sesiId, [...(hapusPerSesi.get(sesiId) ?? []), siswaId]);
    }

    if (upserts.length > 0) {
      const { error } = await supabase.from("presensi_isi").upsert(upserts, { onConflict: "sesi_id,siswa_id" });
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
    }
    for (const [sesiId, ids] of hapusPerSesi) {
      const { error } = await supabase.from("presensi_isi").delete().eq("sesi_id", sesiId).in("siswa_id", ids);
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

  const th = "border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center font-medium";
  const td = "border border-slate-300 dark:border-slate-600 text-center";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Presensi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Rekap kehadiran per pertemuan untuk tiap kelas. Menu ini hanya terlihat oleh admin.
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
              setSaved(false);
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

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={bulanBaru}
            onChange={(e) => setBulanBaru(e.target.value)}
            title="Bulan"
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={hariTerpilih}
            onChange={(e) => setHariBaru(Number(e.target.value))}
            title="Tanggal"
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {opsiHari.map((o) => (
              <option key={o.d} value={o.d} disabled={o.dipakai}>
                {o.d} ({o.nama}){o.dipakai ? " - sudah ada" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={tambahKolom}
            disabled={adding || !rombelAktif || !tanggalBaru || sesi.some((s) => s.tanggal === tanggalBaru)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Tambah Kolom
          </button>
        </div>

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
          <span className="text-xs text-amber-600 dark:text-amber-400">Ada perubahan belum disimpan</span>
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
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-auto max-h-[75vh]">
          <table className="border-collapse text-sm text-slate-800 dark:text-slate-200">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/40">
                <th rowSpan={3} className={`${th} sticky left-0 z-10 bg-slate-50 dark:bg-slate-700 w-12`}>
                  No
                </th>
                <th rowSpan={3} className={`${th} sticky left-12 z-10 bg-slate-50 dark:bg-slate-700 min-w-[220px]`}>
                  Nama Siswa
                </th>
                {kelompokBulan.map((b, i) => (
                  <th key={i} colSpan={b.jumlah} className={th}>
                    {b.label}
                  </th>
                ))}
                {sesi.length === 0 && <th className={`${th} text-slate-400 font-normal`}>Belum ada kolom</th>}
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-700/40">
                {sesi.map((s, i) => (
                  <th key={s.id} className={`${th} min-w-[44px] relative group`}>
                    {hari(s.tanggal)}
                    <button
                      onClick={() => hapusKolom(s, i + 1)}
                      title="Hapus kolom"
                      className="absolute -top-0.5 -right-0.5 hidden group-hover:block rounded-full bg-red-500 text-white p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-700/40">
                {sesi.map((s, i) => (
                  <th key={s.id} className={`${th} italic font-normal text-xs text-slate-500 dark:text-slate-400`}>
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {siswa.map((s, baris) => {
                const aktif = barisAktif === baris;
                const bgBaris = aktif ? "bg-indigo-100 dark:bg-indigo-500/25" : "bg-white dark:bg-slate-800";
                return (
                <tr key={s.id}>
                  <td className={`${td} sticky left-0 ${bgBaris} text-slate-500 dark:text-slate-400`}>
                    {baris + 1}
                  </td>
                  <td className={`${td} sticky left-12 ${bgBaris} text-left px-2 py-1 font-medium whitespace-nowrap`}>
                    {s.nama}
                  </td>
                  {sesi.map((x, kolom) => (
                    <td key={x.id} className={`${td} ${aktif ? "bg-indigo-100 dark:bg-indigo-500/25" : ""}`}>
                      <input
                        data-cell={`${baris}-${kolom}`}
                        value={nilai[kunci(x.id, s.id)] ?? ""}
                        onChange={(e) => ubah(x.id, s.id, e.target.value)}
                        onKeyDown={(e) => tekanTombol(e, baris, kolom)}
                        onPaste={(e) => tempel(e, baris, kolom)}
                        onFocus={(e) => {
                          e.target.select();
                          setBarisAktif(baris);
                        }}
                        onBlur={() => setBarisAktif((b) => (b === baris ? null : b))}
                        maxLength={2}
                        autoComplete="off"
                        className="w-11 h-8 text-center bg-transparent text-slate-900 dark:text-slate-100 uppercase font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                      />
                    </td>
                  ))}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        <span className="font-medium">Ket.:</span>{" "}
        {KODE_PRESENSI.map((k, i) => (
          <span key={k.kode}>
            <span className="font-bold">{k.kode}</span>={k.label}
            {i < KODE_PRESENSI.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        Ketik kode langsung di sel (H, S, I, L, M, A, P, G); panah atau Enter untuk pindah sel. Bisa juga menempel
        (paste) dari Excel: klik sel pertama lalu Ctrl+V; urutan baris harus sama dengan urutan siswa di tabel. Arahkan kursor ke
        tanggal untuk menghapus kolom.
      </p>
    </div>
  );
}
