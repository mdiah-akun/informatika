"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseImportSikap, type BarisImport } from "@/lib/sikap-import";
import type { Sikap, SikapJenis } from "@/types/sikap";
import type { Siswa } from "@/types/siswa";
import { Loader2, Upload } from "lucide-react";

type SiswaRingkas = Pick<Siswa, "id" | "nisn" | "nama" | "kelas">;

const TAB: { jenis: SikapJenis; label: string }[] = [
  { jenis: "negatif", label: "Sikap Negatif" },
  { jenis: "positif", label: "Sikap Positif" },
];

const kunciDup = (siswaId: string, tgl: string, nama: string) => `${siswaId}|${tgl}|${nama.trim().toLowerCase()}`;

function formatTanggal(tgl: string): string {
  return new Date(`${tgl}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminImportSikapClient({
  siswaList,
  sikapList,
}: {
  siswaList: SiswaRingkas[];
  sikapList: Sikap[];
}) {
  const [jenis, setJenis] = useState<SikapJenis>("negatif");
  const [teks, setTeks] = useState("");
  const [baris, setBaris] = useState<BarisImport[] | null>(null);
  const [duplikat, setDuplikat] = useState<Set<string>>(new Set());
  const [memeriksa, setMemeriksa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasil, setHasil] = useState<string | null>(null);

  // NISN di Excel sering kehilangan angka 0 di depan, jadi dicocokkan juga tanpa nol depan.
  const peta = new Map<string, SiswaRingkas>();
  for (const s of siswaList) {
    if (!s.nisn) continue;
    peta.set(s.nisn, s);
    peta.set(s.nisn.replace(/^0+/, ""), s);
  }
  const cariSiswa = (nisn: string) => peta.get(nisn) ?? peta.get(nisn.replace(/^0+/, ""));

  const sikapSesuai = sikapList.filter((s) => s.jenis === jenis);
  const cariSikap = (nama: string) => sikapSesuai.find((s) => s.nama.trim().toLowerCase() === nama.trim().toLowerCase());

  function gantiTab(j: SikapJenis) {
    setJenis(j);
    setTeks("");
    setBaris(null);
    setHasil(null);
    setError(null);
  }

  async function handlePeriksa() {
    setError(null);
    setHasil(null);
    const urai = parseImportSikap(teks);
    if (urai.length === 0) {
      setBaris(null);
      setError("Tidak ada baris yang bisa dibaca. Tempel data dari Excel dulu.");
      return;
    }
    setMemeriksa(true);
    const ids = Array.from(new Set(urai.map((b) => cariSiswa(b.nisn)?.id).filter((x): x is string => !!x)));
    const ada = new Set<string>();
    const supabase = createClient();
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await supabase
        .from("sikap_catatan")
        .select("siswa_id, tanggal, nama")
        .eq("jenis", jenis)
        .in("siswa_id", ids.slice(i, i + 100));
      if (error) {
        setMemeriksa(false);
        setError(error.message);
        return;
      }
      for (const r of data ?? []) ada.add(kunciDup(r.siswa_id, r.tanggal, r.nama));
    }
    setDuplikat(ada);
    setBaris(urai);
    setMemeriksa(false);
  }

  function status(b: BarisImport): { ok: boolean; teks: string } {
    if (b.galat) return { ok: false, teks: b.galat };
    const s = cariSiswa(b.nisn);
    if (!s) return { ok: false, teks: "NISN tidak ditemukan di Data Siswa" };
    if (duplikat.has(kunciDup(s.id, b.tanggal!, b.sikap))) return { ok: false, teks: "Sudah ada (dilewati)" };
    return { ok: true, teks: "Siap diimpor" };
  }

  const layak = (baris ?? []).filter((b) => status(b).ok);

  async function handleImpor() {
    if (!baris) return;
    setError(null);
    const lihat = new Set<string>();
    const rows: Record<string, string | number | null>[] = [];
    for (const b of baris) {
      if (!status(b).ok) continue;
      const s = cariSiswa(b.nisn)!;
      const k = kunciDup(s.id, b.tanggal!, b.sikap);
      if (lihat.has(k)) continue; // baris kembar di tempelan yang sama
      lihat.add(k);
      rows.push({
        siswa_id: s.id,
        sikap_id: cariSikap(b.sikap)?.id ?? null,
        jenis,
        nama: b.sikap,
        poin: b.poin,
        tanggal: b.tanggal,
      });
    }
    if (rows.length === 0) {
      setError("Tidak ada baris yang layak diimpor.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from("sikap_catatan").insert(rows.slice(i, i + 200));
      if (error) {
        setSaving(false);
        setError(`Gagal pada paket ke-${i / 200 + 1}: ${error.message}. Paket sebelumnya sudah masuk, periksa lagi sebelum mengulang.`);
        return;
      }
    }
    setSaving(false);
    setHasil(`${rows.length} catatan sikap ${jenis} berhasil diimpor.`);
    setBaris(null);
    setTeks("");
  }

  const th = "px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Import Sikap</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tempel catatan sikap dari Excel (kolom: No, Tgl.Catat, NISN, Nama, Kelas, Sikap, Poin). Siswa dicocokkan lewat
          NISN. Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-slate-200 dark:border-slate-700">
        {TAB.map((t) => (
          <button
            key={t.jenis}
            onClick={() => gantiTab(t.jenis)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
              jenis === t.jenis
                ? "border-indigo-600 text-indigo-700 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}
      {hasil && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-2 mb-4">
          {hasil}
        </p>
      )}

      <textarea
        value={teks}
        onChange={(e) => {
          setTeks(e.target.value);
          setBaris(null);
        }}
        rows={6}
        placeholder={`Tempel data sikap ${jenis} dari Excel di sini (Ctrl+V)...`}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex flex-wrap items-center gap-3 mt-3 mb-4">
        <button
          onClick={handlePeriksa}
          disabled={memeriksa || !teks.trim()}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-50"
        >
          {memeriksa && <Loader2 className="h-4 w-4 animate-spin" />}
          Periksa data
        </button>
        {baris && (
          <>
            <button
              onClick={handleImpor}
              disabled={saving || layak.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Impor {layak.length} baris
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {baris.length} baris dibaca, {layak.length} siap, {baris.length - layak.length} dilewati
            </span>
          </>
        )}
      </div>

      {baris && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-auto scroll-samar max-h-[60vh]">
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
              <tr>
                <th className={th}>Baris</th>
                <th className={th}>Tanggal</th>
                <th className={th}>NISN</th>
                <th className={th}>Nama</th>
                <th className={th}>Kelas</th>
                <th className={th}>Sikap</th>
                <th className={th}>Poin</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
              {baris.map((b) => {
                const st = status(b);
                return (
                  <tr key={b.baris} className={st.ok ? "" : "bg-red-50/60 dark:bg-red-500/5"}>
                    <td className="px-3 py-1.5 text-slate-400">{b.baris}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{b.tanggal ? formatTanggal(b.tanggal) : "-"}</td>
                    <td className="px-3 py-1.5">{b.nisn}</td>
                    <td className="px-3 py-1.5">{b.nama}</td>
                    <td className="px-3 py-1.5">{b.kelas}</td>
                    <td className="px-3 py-1.5 min-w-[260px]">{b.sikap}</td>
                    <td className="px-3 py-1.5 text-center">{b.poin ?? "-"}</td>
                    <td
                      className={`px-3 py-1.5 whitespace-nowrap ${
                        st.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {st.teks}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Catatan yang sudah ada (siswa, tanggal, dan sikap sama) tidak diimpor dua kali. Sikap yang namanya sama dengan
        daftar di menu Sikap akan terhubung ke daftar itu; yang tidak sama tetap tersimpan sebagai teks. Poin disimpan
        persis seperti di Excel.
      </p>
    </div>
  );
}
