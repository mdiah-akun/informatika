"use client";

import { useState } from "react";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import { materiFileViewUrl } from "@/lib/file-types";
import type { Ebook } from "@/types/ebook";
import type { Kelas } from "@/types/materi";
import { BookText, Paperclip } from "lucide-react";

export default function EbookClient({
  ebookList,
  initialKelas,
  lockKelas = false,
}: {
  ebookList: Ebook[];
  initialKelas?: Kelas;
  lockKelas?: boolean;
}) {
  const [selectedKelas, setSelectedKelas] = useState<Kelas>(initialKelas ?? KELAS_LIST[0]);
  const items = ebookList.filter((e) => e.kelas === selectedKelas);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">E-book Siswa</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Buku pegangan siswa{lockKelas ? ` ${kelasLabel(selectedKelas)}` : ""}
      </p>

      {!lockKelas && (
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
          {KELAS_LIST.map((k) => (
            <button
              key={k}
              onClick={() => setSelectedKelas(k)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                selectedKelas === k
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
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Belum ada e-book untuk {kelasLabel(selectedKelas)}.
        </p>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {items.map((item) => (
            <a
              key={item.id}
              href={materiFileViewUrl(item.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <BookText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                {item.judul}
              </span>
              <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
