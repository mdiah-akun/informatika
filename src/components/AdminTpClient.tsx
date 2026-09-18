"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import type { Bab, Kelas } from "@/types/materi";
import type { TP } from "@/types/tp";
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";

function TpForm({
  babId,
  existingCount,
  initial,
  onCancel,
  onSaved,
}: {
  babId: string;
  existingCount: number;
  initial?: TP;
  onCancel: () => void;
  onSaved: (item: TP) => void;
}) {
  const [kode, setKode] = useState(initial?.kode ?? "");
  const [deskripsi, setDeskripsi] = useState(initial?.deskripsi ?? "");
  const [urutan, setUrutan] = useState(initial?.urutan ?? existingCount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kode.trim()) {
      setError("Kode TP wajib diisi (mis. TP1).");
      return;
    }
    if (!deskripsi.trim()) {
      setError("Deskripsi tujuan pembelajaran wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = { bab_id: babId, kode, deskripsi, urutan };

    const query = initial
      ? supabase.from("tp").update(payload).eq("id", initial.id).select().single()
      : supabase.from("tp").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan TP.");
      return;
    }
    onSaved(data as TP);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Kode TP</label>
        <input
          autoFocus
          value={kode}
          onChange={(e) => setKode(e.target.value)}
          placeholder="TP1"
          className="w-full max-w-[160px] rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          Deskripsi Tujuan Pembelajaran
        </label>
        <textarea
          rows={3}
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Menerapkan berpikir komputasional dalam menyelesaikan persoalan..."
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
      </div>

      <div className="max-w-[140px]">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Urutan</label>
        <input
          type="number"
          value={urutan}
          onChange={(e) => setUrutan(Number(e.target.value))}
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm px-3 py-1.5 text-slate-600 dark:text-slate-300"
        >
          <X className="h-3.5 w-3.5" />
          Batal
        </button>
      </div>
    </form>
  );
}

export default function AdminTpClient({ babList, tpAwal }: { babList: Bab[]; tpAwal: TP[] }) {
  const [tpList, setTpList] = useState<TP[]>(tpAwal);
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [selectedBabId, setSelectedBabId] = useState<string | null>(null);
  const [formFor, setFormFor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const bab = babList.filter((b) => b.kelas === kelas).sort((a, b) => a.urutan - b.urutan);
  const activeBabId = selectedBabId ?? bab[0]?.id ?? null;
  const activeBab = bab.find((b) => b.id === activeBabId);

  const items = activeBab
    ? tpList.filter((t) => t.bab_id === activeBab.id).sort((a, b) => a.urutan - b.urutan)
    : [];

  async function handleDelete(item: TP) {
    if (!confirm(`Hapus TP "${item.kode}"?`)) return;
    setBusyId(item.id);
    const supabase = createClient();
    const { error } = await supabase.from("tp").delete().eq("id", item.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setTpList((prev) => prev.filter((t) => t.id !== item.id));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Tujuan Pembelajaran (TP)</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Catat tujuan pembelajaran per bab untuk tiap kelas
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {KELAS_LIST.map((k) => (
          <button
            key={k}
            onClick={() => {
              setKelas(k);
              setSelectedBabId(null);
              setFormFor(null);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              kelas === k
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {kelasLabel(k)}
          </button>
        ))}
      </div>

      {bab.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Belum ada bab untuk {kelasLabel(kelas)}. Tambahkan bab dulu di menu Kelola Materi.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {bab.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBabId(b.id);
                  setFormFor(null);
                }}
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

          {activeBab && (
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">{activeBab.judul}</h2>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                {items.length === 0 && formFor !== "new" && (
                  <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
                    Belum ada TP untuk bab ini.
                  </p>
                )}

                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {items.map((item) => (
                    <li key={item.id} className="px-5 py-3">
                      {formFor === item.id ? (
                        <TpForm
                          babId={activeBab.id}
                          existingCount={items.length}
                          initial={item}
                          onCancel={() => setFormFor(null)}
                          onSaved={(updated) => {
                            setTpList((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                            setFormFor(null);
                          }}
                        />
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 text-xs font-semibold mb-1">
                              {item.kode}
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                              {item.deskripsi}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setFormFor(item.id)}
                              className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={busyId === item.id}
                              className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                              title="Hapus"
                            >
                              {busyId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}

                  {formFor === "new" && (
                    <li className="px-5 py-3">
                      <TpForm
                        babId={activeBab.id}
                        existingCount={items.length}
                        onCancel={() => setFormFor(null)}
                        onSaved={(created) => {
                          setTpList((prev) => [...prev, created]);
                          setFormFor(null);
                        }}
                      />
                    </li>
                  )}
                </ul>

                {formFor !== "new" && (
                  <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => setFormFor("new")}
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah TP
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
