"use client";

import { useEffect, useState } from "react";
import QrKode from "@/components/QrKode";
import { Check, Copy, ExternalLink, Printer } from "lucide-react";

const LANGKAH = [
  "Buka kamera HP, lalu arahkan ke kode QR ini.",
  "Ketuk tautan yang muncul untuk membuka halaman ujian.",
  "Masukkan NISN kamu, lalu token dari pengawas/guru.",
  "Kerjakan soal dengan jujur. Jangan berpindah tab atau keluar dari layar penuh.",
];

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function AdminLinkUjianClient({ urlUjian, urlProduksi }: { urlUjian: string; urlProduksi: string }) {
  const [url, setUrl] = useState("");
  const [lokal, setLokal] = useState(false);
  const [judul, setJudul] = useState("SCAN UNTUK MASUK UJIAN");
  const [mode, setMode] = useState<"1" | "4">("1");
  const [tersalin, setTersalin] = useState(false);
  useEffect(() => {
    setUrl(`${window.location.origin}/link-ujian`);
    setLokal(window.location.hostname === "localhost");
  }, []);

  const tautan = url.trim();
  const siap = /^https?:\/\/\S+$/i.test(tautan);

  async function salin() {
    try {
      await navigator.clipboard.writeText(tautan);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  return (
    <div>
      <div className="print:hidden">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Link Ujian</h1>
          <span className="flex-1" />
          <button
            onClick={salin}
            disabled={!siap}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {tersalin ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {tersalin ? "Tersalin" : "Salin link"}
          </button>
          <a
            href={urlUjian}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4" />
            Buka situs ujian
          </a>
          <button
            onClick={() => window.print()}
            disabled={!siap}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Cetak (A4)
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Siswa yang memindai QR atau mengklik link ini otomatis diarahkan ke situs ujian ({urlUjian}). Cetak lalu
          tempel di papan tulis, atau bagikan linknya.
        </p>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Alamat link (yang ada di QR)
              <input value={url} onChange={(e) => setUrl(e.target.value)} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Judul
              <input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                maxLength={60}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Susunan di kertas A4
              <select value={mode} onChange={(e) => setMode(e.target.value as "1" | "4")} className={`${inputClass} mt-1`}>
                <option value="1">1 QR besar per halaman</option>
                <option value="4">4 QR per halaman (untuk digunting)</option>
              </select>
            </label>
          </div>
          {!siap && url !== "" && <p className="text-xs text-red-600 dark:text-red-400">Alamat harus diawali http:// atau https://</p>}
          {lokal && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Anda sedang membuka dari komputer lokal, jadi alamat di atas bukan alamat yang bisa dibuka siswa. Ubah ke{" "}
              <button
                type="button"
                onClick={() => setUrl(`${urlProduksi}/link-ujian`)}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {urlProduksi}/link-ujian
              </button>{" "}
              sebelum mencetak.
            </p>
          )}
        </div>
      </div>

      {siap && mode === "1" && (
        <div id="area-cetak" className="mx-auto max-w-xl bg-white text-slate-900 border border-slate-200 rounded-xl p-8 text-center print:border-0 print:max-w-none">
          <p className="text-lg font-bold tracking-wide mb-1">SMP NEGERI 14 TARAKAN</p>
          <p className="text-2xl font-extrabold mb-4">{judul}</p>
          <QrKode teks={tautan} className="mx-auto w-80 max-w-full" />
          <p className="mt-3 text-sm break-all">{tautan}</p>
          <ol className="mt-5 mx-auto max-w-md text-left text-sm list-decimal pl-5 space-y-1">
            {LANGKAH.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ol>
        </div>
      )}

      {siap && mode === "4" && (
        <div id="area-cetak" className="mx-auto max-w-3xl bg-white text-slate-900 print:max-w-none">
          <div className="grid grid-cols-2 gap-0">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border border-dashed border-slate-400 p-5 text-center">
                <p className="text-xs font-semibold">SMP NEGERI 14 TARAKAN</p>
                <p className="text-base font-extrabold mb-2">{judul}</p>
                <QrKode teks={tautan} className="mx-auto w-44" />
                <p className="mt-2 text-[11px] break-all">{tautan}</p>
                <p className="mt-1 text-[11px]">
                  Pindai dengan kamera HP, lalu masukkan NISN dan token dari pengawas/guru.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
