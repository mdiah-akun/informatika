"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import QrKode from "@/components/QrKode";

const LANGKAH = [
  "Klik tombol Buka Ujian di bawah (atau pindai QR dengan kamera HP lain).",
  "Masukkan NISN kamu, lalu token dari pengawas/guru.",
  "Kerjakan soal dengan jujur. Jangan berpindah tab atau keluar dari layar penuh.",
];

export default function AksesUjianClient({ urlUjian }: { urlUjian: string }) {
  const [tersalin, setTersalin] = useState(false);

  async function salin() {
    try {
      await navigator.clipboard.writeText(urlUjian);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Link Ujian</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Masuk ke situs ujian online sekolah.</p>

      <div className="max-w-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
        <div className="mx-auto w-64 max-w-full rounded-lg bg-white p-2">
          <QrKode teks={urlUjian} />
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 break-all">{urlUjian}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <a
            href={urlUjian}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700"
          >
            <ExternalLink className="h-4 w-4" />
            Buka Ujian
          </a>
          <button
            onClick={salin}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {tersalin ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {tersalin ? "Tersalin" : "Salin link"}
          </button>
        </div>

        <ol className="mt-6 text-left text-sm text-slate-600 dark:text-slate-300 list-decimal pl-5 space-y-1">
          {LANGKAH.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
