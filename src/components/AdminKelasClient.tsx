"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NILAI_RAPOT_OPSI, type KelasPengaturan, type NilaiRapot } from "@/types/kelas-pengaturan";
import { Loader2, Check } from "lucide-react";

type Isi = { wali: string; rapot: NilaiRapot | ""; min: string; max: string };
type PetaIsi = Record<string, Isi>;

const KOSONG: Isi = { wali: "", rapot: "", min: "", max: "" };

function dariDb(p?: KelasPengaturan): Isi {
  if (!p) return KOSONG;
  return {
    wali: p.wali_kelas ?? "",
    rapot: p.nilai_rapot ?? "",
    min: p.dongkrak_min === null ? "" : String(p.dongkrak_min),
    max: p.dongkrak_max === null ? "" : String(p.dongkrak_max),
  };
}

function sama(a: Isi, b: Isi): boolean {
  return a.wali === b.wali && a.rapot === b.rapot && a.min === b.min && a.max === b.max;
}

export default function AdminKelasClient({
  rombelList,
  pengaturanAwal,
}: {
  rombelList: string[];
  pengaturanAwal: KelasPengaturan[];
}) {
  const awal: PetaIsi = {};
  for (const p of pengaturanAwal) awal[p.rombel] = dariDb(p);

  const [isi, setIsi] = useState<PetaIsi>(awal);
  const [tersimpan, setTersimpan] = useState<PetaIsi>(awal);
  const [barisAktif, setBarisAktif] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ambil = (peta: PetaIsi, rombel: string): Isi => peta[rombel] ?? KOSONG;
  const adaPerubahan = rombelList.some((r) => !sama(ambil(isi, r), ambil(tersimpan, r)));

  function ubah(rombel: string, patch: Partial<Isi>) {
    setSaved(false);
    setIsi((prev) => ({ ...prev, [rombel]: { ...ambil(prev, rombel), ...patch } }));
  }

  function ubahAngka(rombel: string, kolom: "min" | "max", teks: string) {
    if (!/^\d{0,3}$/.test(teks)) return;
    ubah(rombel, { [kolom]: teks });
  }

  async function handleSimpan() {
    setError(null);
    const upserts: Record<string, string | number | null>[] = [];
    const hapus: string[] = [];

    for (const rombel of rombelList) {
      const sekarang = ambil(isi, rombel);
      if (sama(sekarang, ambil(tersimpan, rombel))) continue;

      const min = sekarang.min === "" ? null : Number(sekarang.min);
      const max = sekarang.max === "" ? null : Number(sekarang.max);
      if ((min !== null && min > 100) || (max !== null && max > 100)) {
        setError(`Nilai Dongkrak ${rombel} harus 0 sampai 100.`);
        return;
      }
      if (min !== null && max !== null && min > max) {
        setError(`Nilai Dongkrak ${rombel}: Min tidak boleh lebih besar dari Max.`);
        return;
      }

      if (sekarang.wali.trim() === "" && sekarang.rapot === "" && min === null && max === null) {
        hapus.push(rombel);
      } else {
        upserts.push({
          rombel,
          wali_kelas: sekarang.wali.trim(),
          nilai_rapot: sekarang.rapot === "" ? null : sekarang.rapot,
          dongkrak_min: min,
          dongkrak_max: max,
          updated_at: new Date().toISOString(),
        });
      }
    }

    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    if (upserts.length > 0) {
      const { error } = await supabase.from("kelas_pengaturan").upsert(upserts, { onConflict: "rombel" });
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
    }
    if (hapus.length > 0) {
      const { error } = await supabase.from("kelas_pengaturan").delete().in("rombel", hapus);
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

  const th = "border border-slate-300 dark:border-slate-600 px-3 py-2 text-center font-medium bg-slate-50 dark:bg-slate-700";
  const td = "border border-slate-300 dark:border-slate-600";
  const input =
    "w-full bg-transparent px-2 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-inset focus:ring-indigo-500";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Kelas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Wali kelas, jenis Nilai Rapot, dan batas Nilai Dongkrak untuk tiap kelas. Daftar kelas mengikuti data siswa.
          Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleSimpan}
          disabled={saving || !adaPerubahan}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          Simpan
        </button>
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Tersimpan.</span>}
        {adaPerubahan && !saved && (
          <span className="text-xs text-amber-600 dark:text-amber-400">Ada perubahan belum disimpan</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {rombelList.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center text-slate-400 dark:text-slate-500">
          Belum ada data siswa, jadi belum ada kelas. Tambahkan siswa di menu Data Siswa.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-auto scroll-samar">
          <table className="w-full border-collapse text-sm text-slate-800 dark:text-slate-200">
            <thead>
              <tr>
                <th rowSpan={2} className={`${th} w-14`}>
                  No
                </th>
                <th rowSpan={2} className={`${th} w-28`}>
                  Kelas
                </th>
                <th rowSpan={2} className={`${th} min-w-[240px]`}>
                  Wali Kelas
                </th>
                <th rowSpan={2} className={`${th} min-w-[200px]`}>
                  Nilai Rapot
                </th>
                <th colSpan={2} className={th}>
                  Nilai Dongkrak
                </th>
              </tr>
              <tr>
                <th className={`${th} w-24`}>Min.</th>
                <th className={`${th} w-24`}>Max</th>
              </tr>
            </thead>
            <tbody>
              {rombelList.map((rombel, i) => {
                const sekarang = ambil(isi, rombel);
                const aktif = barisAktif === rombel;
                const bg = aktif ? "bg-indigo-100 dark:bg-indigo-500/25" : "";
                const fokus = {
                  onFocus: () => setBarisAktif(rombel),
                  onBlur: () => setBarisAktif((b) => (b === rombel ? null : b)),
                };
                return (
                  <tr key={rombel}>
                    <td className={`${td} text-center text-slate-500 dark:text-slate-400 ${bg}`}>{i + 1}</td>
                    <td className={`${td} text-center font-medium ${bg}`}>{rombel}</td>
                    <td className={`${td} ${bg}`}>
                      <input
                        value={sekarang.wali}
                        onChange={(e) => ubah(rombel, { wali: e.target.value })}
                        placeholder="Nama wali kelas"
                        className={input}
                        {...fokus}
                      />
                    </td>
                    <td className={`${td} ${bg}`}>
                      <select
                        value={sekarang.rapot}
                        onChange={(e) => ubah(rombel, { rapot: e.target.value as NilaiRapot | "" })}
                        className={input}
                        {...fokus}
                      >
                        <option value="">-</option>
                        {NILAI_RAPOT_OPSI.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={`${td} ${bg}`}>
                      <input
                        value={sekarang.min}
                        onChange={(e) => ubahAngka(rombel, "min", e.target.value)}
                        inputMode="numeric"
                        className={`${input} text-center`}
                        {...fokus}
                      />
                    </td>
                    <td className={`${td} ${bg}`}>
                      <input
                        value={sekarang.max}
                        onChange={(e) => ubahAngka(rombel, "max", e.target.value)}
                        inputMode="numeric"
                        className={`${input} text-center`}
                        {...fokus}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Nilai Rapot: Asli, Asli+Hadir, Dongkrak(asli), atau Dongkrak(AsliHadir). Nilai Dongkrak Min. dan Max (0 sampai
        100) berlaku untuk pilihan Dongkrak. Baris yang semua isiannya dikosongkan akan dihapus saat disimpan.
      </p>
    </div>
  );
}
