"use client";

import { useState } from "react";
import Link from "next/link";
import { materiFileViewUrl } from "@/lib/file-types";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import { BookOpen, Paperclip } from "lucide-react";
import type { Bab, Kelas, Materi, MateriLampiran } from "@/types/materi";

export default function MateriListClient({
  babList,
  materiList,
  lampiranList,
  initialKelas,
  lockKelas = false,
}: {
  babList: Bab[];
  materiList: Materi[];
  lampiranList: MateriLampiran[];
  initialKelas?: Kelas;
  /** Siswa yang kelasnya sudah diketahui dikunci ke kelasnya sendiri --
   *  tab pemilih kelas disembunyikan. */
  lockKelas?: boolean;
}) {
  const [selectedKelas, setSelectedKelas] = useState<Kelas>(initialKelas ?? KELAS_LIST[0]);

  const bab = babList.filter((b) => b.kelas === selectedKelas);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Daftar Materi</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Materi Informatika{lockKelas ? ` ${kelasLabel(selectedKelas)}` : ""}, disusun per bab
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

      {bab.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Belum ada materi untuk {kelasLabel(selectedKelas)}.
        </p>
      )}

      <div className="space-y-8">
        {bab.map((b) => {
          const items = materiList.filter((m) => m.bab_id === b.id);
          if (items.length === 0) return null;
          return (
            <div key={b.id}>
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">{b.judul}</h2>
              <div>
                {items.map((m, idx) => {
                  const subItems = lampiranList.filter((l) => l.materi_id === m.id);
                  const isLast = idx === items.length - 1;
                  return (
                    <div key={m.id} className={isLast ? "" : "mb-3"}>
                      <Link
                        href={`/materi/${m.slug}`}
                        className="flex gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm transition-all"
                      >
                        <div className="w-28 sm:w-40 shrink-0 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          {m.gambar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.gambar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-6 w-6 text-slate-300 dark:text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0 py-3 pr-4 flex flex-col justify-center">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{m.judul}</p>
                          {m.konten && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{m.konten}</p>
                          )}
                        </div>
                      </Link>

                      {subItems.length > 0 && (
                        <div className="ml-6 sm:ml-10 mt-2 flex flex-wrap gap-2">
                          {subItems.map((sub) => (
                            <a
                              key={sub.id}
                              href={materiFileViewUrl(sub.file_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-medium px-3 py-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                            >
                              <Paperclip className="h-3 w-3 shrink-0" />
                              {sub.judul}
                            </a>
                          ))}
                        </div>
                      )}

                      {subItems.length > 0 && !isLast && (
                        <hr className="border-slate-200 dark:border-slate-700 mt-3" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
