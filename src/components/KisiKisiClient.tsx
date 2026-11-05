"use client";

import { useState } from "react";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import { materiFileViewUrl } from "@/lib/file-types";
import type { KisiKisi } from "@/types/kisi-kisi";
import type { Kelas } from "@/types/materi";
import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react";

export default function KisiKisiClient({
  kisiList,
  initialKelas,
  lockKelas = false,
}: {
  kisiList: KisiKisi[];
  initialKelas?: Kelas;
  lockKelas?: boolean;
}) {
  const [kelas, setKelas] = useState<Kelas>(initialKelas ?? KELAS_LIST[0]);
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const items = kisiList.filter((k) => k.kelas === kelas).sort((a, b) => a.urutan - b.urutan);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Kisi-kisi</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Kisi-kisi penilaian{lockKelas ? ` ${kelasLabel(kelas)}` : ""}
      </p>

      {!lockKelas && (
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
          {KELAS_LIST.map((k) => (
            <button
              key={k}
              onClick={() => setKelas(k)}
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
      )}

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada kisi-kisi untuk {kelasLabel(kelas)}.</p>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {items.map((k) => {
            const buka = terbuka === k.id;
            return (
              <div
                key={k.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <button
                    onClick={() => setTerbuka(buka ? null : k.id)}
                    className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                  >
                    {buka ? (
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{k.judul}</span>
                  </button>
                  {k.url && (
                    <a
                      href={materiFileViewUrl(k.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Buka file
                    </a>
                  )}
                </div>
                {buka && (
                  <div className="px-4 pb-4 pl-10">
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {k.isi || "Belum ada isi."}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
