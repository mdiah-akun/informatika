"use client";

import { useState } from "react";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import type { Bab, Kelas } from "@/types/materi";
import type { TP } from "@/types/tp";
import { Target } from "lucide-react";

export default function TpClient({
  babList,
  tpList,
  initialKelas,
  lockKelas = false,
}: {
  babList: Bab[];
  tpList: TP[];
  initialKelas?: Kelas;
  lockKelas?: boolean;
}) {
  const [selectedKelas, setSelectedKelas] = useState<Kelas>(initialKelas ?? KELAS_LIST[0]);
  const [selectedBabId, setSelectedBabId] = useState<string | null>(null);

  const bab = babList.filter((b) => b.kelas === selectedKelas).sort((a, b) => a.urutan - b.urutan);
  const activeBabId = selectedBabId ?? bab[0]?.id ?? null;
  const activeBab = bab.find((b) => b.id === activeBabId);

  const items = activeBab ? tpList.filter((t) => t.bab_id === activeBab.id).sort((a, b) => a.urutan - b.urutan) : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Tujuan Pembelajaran</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Daftar TP{lockKelas ? ` ${kelasLabel(selectedKelas)}` : ""} per bab
      </p>

      {!lockKelas && (
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
          {KELAS_LIST.map((k) => (
            <button
              key={k}
              onClick={() => {
                setSelectedKelas(k);
                setSelectedBabId(null);
              }}
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
          Belum ada TP untuk {kelasLabel(selectedKelas)}.
        </p>
      )}

      {bab.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {bab.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => setSelectedBabId(b.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeBabId === b.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              Bab {idx + 1}
            </button>
          ))}
        </div>
      )}

      {activeBab && (
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">{activeBab.judul}</h2>
          {items.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada TP untuk bab ini.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                >
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Target className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      {item.kode}
                      <span className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        Semester {item.semester}
                      </span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{item.deskripsi}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
