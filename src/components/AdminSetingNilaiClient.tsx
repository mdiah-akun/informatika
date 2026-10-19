"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check } from "lucide-react";

type Bobot = {
  f: number;
  s: number;
  sa: number;
  akademik: number;
  kehadiran: number;
  lain: number;
  punishment: number;
  pakaiAmbang: boolean;
  optimum: number;
  minimum: number;
};
type Teks = Record<keyof Bobot, string>;

const BARIS: { kunci: keyof Bobot; label: string }[] = [
  { kunci: "f", label: "Nilai Formatif (F)" },
  { kunci: "s", label: "Nilai Sumatif Lingkup Materi (S)" },
  { kunci: "sa", label: "Nilai Sumatif Akhir Semester (SA)" },
];

const PERSEN: { kunci: keyof Bobot; label: string }[] = [
  { kunci: "akademik", label: "Porsentasi Penilaian akademi" },
  { kunci: "kehadiran", label: "+Porsentasi Nilai Kehadiran" },
  { kunci: "lain", label: "+Porsentasi Nilai Lain (keaktifan dikelas,piket,)" },
  { kunci: "punishment", label: "-Porsentasi Punishment" },
];

const dariAngka = (b: Bobot): Teks => ({
  f: String(b.f),
  s: String(b.s),
  sa: String(b.sa),
  akademik: String(b.akademik),
  kehadiran: String(b.kehadiran),
  lain: String(b.lain),
  punishment: String(b.punishment),
  pakaiAmbang: b.pakaiAmbang ? "ya" : "tidak",
  optimum: String(b.optimum),
  minimum: String(b.minimum),
});
const AMBANG: { kunci: keyof Bobot; label: React.ReactNode }[] = [
  {
    kunci: "optimum",
    label: (
      <>
        Batas terendah nilai <span className="text-sky-600 dark:text-sky-400">Optimum</span>
      </>
    ),
  },
  {
    kunci: "minimum",
    label: (
      <>
        Batas tertinggi nilai <span className="text-red-600 dark:text-red-400">Minimum</span>
      </>
    ),
  },
];

const angka = (t: string): number | null => {
  if (t.trim() === "") return null;
  const n = Number(t.split(",").join("."));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export default function AdminSetingNilaiClient({ awal }: { awal: Bobot }) {
  const [teks, setTeks] = useState<Teks>(dariAngka(awal));
  const [tersimpan, setTersimpan] = useState<Teks>(dariAngka(awal));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const f = angka(teks.f);
  const s = angka(teks.s);
  const sa = angka(teks.sa);
  const valid = f !== null && s !== null && sa !== null;
  const total = valid ? f + s + sa : 0;
  const persen = Object.fromEntries(PERSEN.map((p) => [p.kunci, angka(teks[p.kunci])])) as Record<keyof Bobot, number | null>;
  const persenValid = PERSEN.every((p) => persen[p.kunci] !== null && persen[p.kunci]! <= 100);
  const optimum = angka(teks.optimum);
  const minimum = angka(teks.minimum);
  const KUNCI_SEMUA: (keyof Bobot)[] = [...BARIS, ...PERSEN, ...AMBANG].map((b) => b.kunci).concat("pakaiAmbang");
  const adaPerubahan = KUNCI_SEMUA.map((kunci) => ({ kunci })).some((b) => teks[b.kunci] !== tersimpan[b.kunci]);

  function ubah(kunci: keyof Bobot, nilai: string) {
    if (!/^\d{0,3}([.,]\d{0,2})?$/.test(nilai)) return;
    setSaved(false);
    setTeks((prev) => ({ ...prev, [kunci]: nilai }));
  }

  async function handleSimpan() {
    setError(null);
    if (!valid) {
      setError("Semua bobot harus berupa angka 0 atau lebih.");
      return;
    }
    if (!persenValid) {
      setError("Semua porsentasi harus berupa angka 0 sampai 100.");
      return;
    }
    if (optimum === null || minimum === null || optimum > 100 || minimum > 100) {
      setError("Batas Optimum dan Minimum harus berupa angka 0 sampai 100.");
      return;
    }
    if (minimum >= optimum) {
      setError("Batas tertinggi Minimum harus lebih kecil dari batas terendah Optimum.");
      return;
    }
    if (total <= 0) {
      setError("Jumlah bobot harus lebih dari 0.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("nilai_bobot")
      .upsert(
        {
          id: 1, bobot_f: f, bobot_s: s, bobot_sa: sa,
          persen_akademik: persen.akademik,
          persen_kehadiran: persen.kehadiran,
          persen_lain: persen.lain,
          persen_punishment: persen.punishment,
          tp_pakai_ambang: teks.pakaiAmbang === "ya",
          tp_batas_optimum: Math.round(optimum),
          tp_batas_minimum: Math.round(minimum),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTersimpan(teks);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const fmt = (n: number | null) => (n === null ? "?" : String(n));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Seting Nilai</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bobot untuk menghitung Nilai Akhir Raport. Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      <div className="max-w-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-purple-700 text-white text-lg px-4 py-2">Bobot Nilai Raport</div>
        <table className="w-full text-sm text-slate-800 dark:text-slate-200">
          <tbody>
            {BARIS.map((b) => (
              <tr key={b.kunci} className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-4 py-2.5">{b.label}</td>
                <td className="w-6 text-center">:</td>
                <td className="w-32 p-1">
                  <input
                    value={teks[b.kunci]}
                    onChange={(e) => ubah(b.kunci, e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-md bg-transparent px-2 py-1.5 text-center text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
        Rumus Nilai Akhir Raport = ({fmt(f)} x F + {fmt(s)} x S + {fmt(sa)} x SA) / {valid ? total : "?"}
      </p>

      <div className="max-w-xl mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-purple-700 text-white text-lg px-4 py-2">Menentukan Nilai TP Optimum - Minimum</div>
        <table className="w-full text-sm text-slate-800 dark:text-slate-200">
          <tbody>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <td className="px-4 py-2.5">Gunakan nilai ini sebagai ambang batas</td>
              <td className="w-6 text-center">:</td>
              <td className="w-32 p-1">
                <select
                  value={teks.pakaiAmbang}
                  onChange={(e) => {
                    setSaved(false);
                    setTeks((prev) => ({ ...prev, pakaiAmbang: e.target.value }));
                  }}
                  className="w-full rounded-md bg-transparent px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ya">Ya</option>
                  <option value="tidak">Tidak</option>
                </select>
              </td>
            </tr>
            {AMBANG.map((b) => (
              <tr key={b.kunci} className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-4 py-2.5">{b.label}</td>
                <td className="w-6 text-center">:</td>
                <td className="w-32 p-1">
                  <input
                    value={teks[b.kunci]}
                    onChange={(e) => ubah(b.kunci, e.target.value)}
                    inputMode="numeric"
                    className="w-full rounded-md bg-transparent px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    
	  

      <div className="max-w-xl mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-purple-700 text-white text-lg px-4 py-2">Porsentasi Nilai Raport</div>
        <table className="w-full text-sm text-slate-800 dark:text-slate-200">
          <tbody>
            {PERSEN.map((b) => (
              <tr key={b.kunci} className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-4 py-2.5">{b.label}</td>
                <td className="w-6 text-center">:</td>
                <td className="w-32 p-1">
                  <div className="flex items-center rounded-md focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500">
                    <input
                      value={teks[b.kunci]}
                      onChange={(e) => ubah(b.kunci, e.target.value)}
                      inputMode="decimal"
                      className="w-full bg-transparent pl-2 py-1.5 text-right text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <span className="pr-3 pl-0.5 text-slate-500 dark:text-slate-400">%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

   

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 max-w-xl">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 mt-4">
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
    </div>
  );
}
