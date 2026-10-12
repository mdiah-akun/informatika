"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseSikapPaste } from "@/lib/sikap-paste";
import type { Sikap, SikapJenis } from "@/types/sikap";
import { ClipboardPaste, Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";

const TAB_LIST: { value: SikapJenis; label: string }[] = [
  { value: "positif", label: "Sikap Positif" },
  { value: "negatif", label: "Sikap Negatif" },
];

const inputClass =
  "w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100";

function SikapForm({
  jenis,
  urutanBaru,
  initial,
  onCancel,
  onSaved,
}: {
  jenis: SikapJenis;
  urutanBaru: number;
  initial?: Sikap;
  onCancel: () => void;
  onSaved: (item: Sikap) => void;
}) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [poin, setPoin] = useState(String(initial?.poin ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) {
      setError("Sikap wajib diisi.");
      return;
    }
    if (!/^[+-]?\d+$/.test(poin.trim())) {
      setError("Poin harus berupa angka bulat.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = { jenis, nama: nama.trim(), poin: Number(poin), urutan: initial?.urutan ?? urutanBaru };
    const query = initial
      ? supabase.from("sikap").update(payload).eq("id", initial.id).select().single()
      : supabase.from("sikap").insert(payload).select().single();
    const { data, error } = await query;
    setSaving(false);
    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan sikap.");
      return;
    }
    onSaved(data as Sikap);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Sikap</label>
          <input autoFocus value={nama} onChange={(e) => setNama(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Poin</label>
          <input value={poin} onChange={(e) => setPoin(e.target.value)} inputMode="numeric" className={inputClass} />
        </div>
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

function PasteForm({
  jenis,
  existing,
  onCancel,
  onSaved,
}: {
  jenis: SikapJenis;
  existing: Sikap[];
  onCancel: () => void;
  onSaved: (items: Sikap[]) => void;
}) {
  const [teks, setTeks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { ok, gagal } = parseSikapPaste(teks);
  const sudahAda = new Set(existing.map((s) => s.nama.trim().toLowerCase()));
  const lihat = new Set<string>();
  const baru = ok.filter((r) => {
    const k = r.nama.toLowerCase();
    if (sudahAda.has(k) || lihat.has(k)) return false;
    lihat.add(k);
    return true;
  });
  const dilewati = ok.length - baru.length;

  async function handleSimpan() {
    if (baru.length === 0) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const mulai = existing.length > 0 ? Math.max(...existing.map((s) => s.urutan)) + 1 : 0;
    const rows = baru.map((r, i) => ({ jenis, nama: r.nama, poin: r.poin, urutan: mulai + i }));
    const { data, error } = await supabase.from("sikap").insert(rows).select();
    setSaving(false);
    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan data.");
      return;
    }
    onSaved(data as Sikap[]);
  }

  return (
    <div className="space-y-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          Tempel data (satu sikap per baris, kolom Sikap lalu Poin)
        </label>
        <textarea
          rows={8}
          autoFocus
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          placeholder={"Menolong teman\t5\nMembuang sampah pada tempatnya\t3\n\nBisa dari Excel (kolom Sikap dan Poin), atau teks seperti:\nDatang tepat waktu, 2"}
          className={`${inputClass} font-mono`}
        />
      </div>

      {teks.trim() && (
        <div className="text-sm space-y-2">
          <p className="text-slate-600 dark:text-slate-300">
            Terbaca <span className="font-semibold">{ok.length}</span> baris
            {dilewati > 0 && <>, {dilewati} dilewati karena sudah ada/ganda</>}
            {gagal.length > 0 && <>, <span className="text-red-600 dark:text-red-400">{gagal.length} gagal dibaca</span></>}.
          </p>
          {baru.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600">
                    <th className="px-3 py-1.5 w-10">No</th>
                    <th className="px-3 py-1.5">Sikap</th>
                    <th className="px-3 py-1.5 w-16">Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {baru.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                      <td className="px-3 py-1 text-slate-500">{i + 1}</td>
                      <td className="px-3 py-1">{r.nama}</td>
                      <td className="px-3 py-1">{r.poin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {gagal.length > 0 && (
            <ul className="text-xs text-red-600 dark:text-red-400 list-disc pl-5 space-y-0.5">
              {gagal.slice(0, 8).map((g) => (
                <li key={g.baris}>
                  Baris {g.baris}: {g.alasan} ({g.teks.slice(0, 60)})
                </li>
              ))}
              {gagal.length > 8 && <li>dan {gagal.length - 8} baris lainnya</li>}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSimpan}
          disabled={saving || baru.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Simpan {baru.length > 0 ? `${baru.length} sikap` : ""}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm px-3 py-1.5 text-slate-600 dark:text-slate-300"
        >
          <X className="h-3.5 w-3.5" />
          Batal
        </button>
      </div>
    </div>
  );
}

export default function AdminSikapClient({ sikapAwal }: { sikapAwal: Sikap[] }) {
  const [list, setList] = useState<Sikap[]>(sikapAwal);
  const [jenis, setJenis] = useState<SikapJenis>("positif");
  const [mode, setMode] = useState<"none" | "tambah" | "paste">("none");
  const [editId, setEditId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = list
    .filter((s) => s.jenis === jenis)
    .sort((a, b) => a.urutan - b.urutan || a.created_at.localeCompare(b.created_at));
  const urutanBaru = items.length > 0 ? Math.max(...items.map((s) => s.urutan)) + 1 : 0;
  const label = TAB_LIST.find((t) => t.value === jenis)?.label.toLowerCase();

  async function handleDelete(item: Sikap) {
    if (!confirm(`Hapus sikap "${item.nama}"?`)) return;
    setBusyId(item.id);
    const supabase = createClient();
    const { error } = await supabase.from("sikap").delete().eq("id", item.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setList((prev) => prev.filter((s) => s.id !== item.id));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Sikap</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Daftar macam-macam sikap positif dan negatif beserta poinnya. Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-4">
        {TAB_LIST.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setJenis(t.value);
              setMode("none");
              setEditId(null);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              jenis === t.value
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-slate-400">({list.filter((s) => s.jenis === t.value).length})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setMode(mode === "paste" ? "none" : "paste")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3 py-2 hover:bg-indigo-700"
        >
          <ClipboardPaste className="h-4 w-4" />
          Tempel Data
        </button>
        <button
          onClick={() => setMode(mode === "tambah" ? "none" : "tambah")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Satu
        </button>
      </div>

      {mode === "paste" && (
        <div className="mb-4">
          <PasteForm
            key={jenis}
            jenis={jenis}
            existing={items}
            onCancel={() => setMode("none")}
            onSaved={(baru) => {
              setList((prev) => [...prev, ...baru]);
              setMode("none");
            }}
          />
        </div>
      )}
      {mode === "tambah" && (
        <div className="mb-4">
          <SikapForm
            key={jenis}
            jenis={jenis}
            urutanBaru={urutanBaru}
            onCancel={() => setMode("none")}
            onSaved={(created) => {
              setList((prev) => [...prev, created]);
              setMode("none");
            }}
          />
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 text-left text-slate-500 dark:text-slate-400">
                <th className="px-3 py-1.5 font-medium w-12">No</th>
                <th className="px-3 py-1.5 font-medium">Sikap</th>
                <th className="px-3 py-1.5 font-medium w-24">Poin</th>
                <th className="px-3 py-1.5 font-medium text-right w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                    Belum ada {label}. Klik &quot;Tempel Data&quot; untuk memasukkan banyak sekaligus.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) =>
                  editId === item.id ? (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/60">
                      <td colSpan={4} className="p-3">
                        <SikapForm
                          jenis={jenis}
                          urutanBaru={urutanBaru}
                          initial={item}
                          onCancel={() => setEditId(null)}
                          onSaved={(updated) => {
                            setList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                            setEditId(null);
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700"
                    >
                      <td className="px-3 py-0.5 leading-tight text-slate-500 dark:text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-0.5 leading-tight text-slate-800 dark:text-slate-200">{item.nama}</td>
                      <td className="px-3 py-0.5 leading-tight font-semibold text-slate-800 dark:text-slate-200">{item.poin}</td>
                      <td className="px-3 py-0.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditId(item.id)}
                            className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={busyId === item.id}
                            className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                            title="Hapus"
                          >
                            {busyId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
