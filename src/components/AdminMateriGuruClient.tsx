"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import type { MateriGuru, MateriGuruKategori } from "@/types/materi-guru";
import type { Kelas } from "@/types/materi";
import { Plus, Pencil, Trash2, Loader2, Link2, X, Check } from "lucide-react";

const KATEGORI_LIST: MateriGuruKategori[] = ["Bahan Ajar", "Presentasi", "Lainnya"];

function MateriGuruForm({
  kelas,
  kategori,
  existingCount,
  initial,
  onCancel,
  onSaved,
}: {
  kelas: Kelas;
  kategori: MateriGuruKategori;
  existingCount: number;
  initial?: MateriGuru;
  onCancel: () => void;
  onSaved: (item: MateriGuru) => void;
}) {
  const [judul, setJudul] = useState(initial?.judul ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [labelBab, setLabelBab] = useState(initial?.label_bab ?? "");
  const [labelTp, setLabelTp] = useState(initial?.label_tp ?? "");
  const [keterangan, setKeterangan] = useState(initial?.keterangan ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim()) {
      setError("Judul wajib diisi.");
      return;
    }
    if (!url.trim()) {
      setError("Link wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      kelas,
      kategori,
      judul: judul.trim(),
      url: url.trim(),
      label_bab: labelBab.trim() || null,
      label_tp: labelTp.trim() || null,
      keterangan: keterangan.trim() || null,
      urutan: initial?.urutan ?? existingCount,
    };

    const query = initial
      ? supabase.from("materi_guru").update(payload).eq("id", initial.id).select().single()
      : supabase.from("materi_guru").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan materi guru.");
      return;
    }
    onSaved(data as MateriGuru);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Judul</label>
        <input
          autoFocus
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder={`Contoh: ${kategori} Bab 1`}
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Link</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Label Bab (opsional)
          </label>
          <input
            value={labelBab}
            onChange={(e) => setLabelBab(e.target.value)}
            placeholder="Contoh: Bab 1"
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Label TP (opsional)
          </label>
          <input
            value={labelTp}
            onChange={(e) => setLabelTp(e.target.value)}
            placeholder="Contoh: TP1"
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          Keterangan (opsional)
        </label>
        <input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Catatan singkat"
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

export default function AdminMateriGuruClient({ materiGuruAwal }: { materiGuruAwal: MateriGuru[] }) {
  const [list, setList] = useState<MateriGuru[]>(materiGuruAwal);
  const [kategori, setKategori] = useState<MateriGuruKategori>(KATEGORI_LIST[0]);
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [babFilter, setBabFilter] = useState<string | null>(null);
  const [formFor, setFormFor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const itemsKelasKategori = list
    .filter((m) => m.kategori === kategori && m.kelas === kelas)
    .sort((a, b) => a.urutan - b.urutan);

  const babLabels = Array.from(
    new Set(itemsKelasKategori.map((m) => m.label_bab).filter((v): v is string => !!v))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const items = babFilter ? itemsKelasKategori.filter((m) => m.label_bab === babFilter) : itemsKelasKategori;

  function switchKelas(k: Kelas) {
    setKelas(k);
    setBabFilter(null);
  }

  function switchKategori(k: MateriGuruKategori) {
    setKategori(k);
    setBabFilter(null);
  }

  async function handleDelete(item: MateriGuru) {
    if (!confirm(`Hapus "${item.judul}"?`)) return;
    setBusyId(item.id);
    const supabase = createClient();
    const { error } = await supabase.from("materi_guru").delete().eq("id", item.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setList((prev) => prev.filter((m) => m.id !== item.id));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Materi Guru</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Simpan link materi pegangan guru: bahan ajar, presentasi, dan lainnya. Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-3">
        {KATEGORI_LIST.map((k) => (
          <button
            key={k}
            onClick={() => switchKategori(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              kategori === k
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        {KELAS_LIST.map((k) => (
          <button
            key={k}
            onClick={() => switchKelas(k)}
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

      {babLabels.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setBabFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              babFilter === null
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            Semua
          </button>
          {babLabels.map((label) => (
            <button
              key={label}
              onClick={() => setBabFilter(label)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                babFilter === label
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden ${babLabels.length === 0 ? "mt-3" : ""}`}>
        {items.length === 0 && formFor !== "new" && (
          <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
            Belum ada materi {kategori.toLowerCase()} untuk {kelasLabel(kelas)}.
          </p>
        )}

        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-3">
              {formFor === item.id ? (
                <MateriGuruForm
                  kelas={kelas}
                  kategori={kategori}
                  existingCount={items.length}
                  initial={item}
                  onCancel={() => setFormFor(null)}
                  onSaved={(updated) => {
                    setList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
                    setFormFor(null);
                  }}
                />
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 min-w-0"
                  >
                    <Link2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="truncate">{item.judul}</span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
                          {item.label_tp || "Umum"}
                        </span>
                      </span>
                      {item.keterangan && (
                        <span className="block text-xs text-slate-400 dark:text-slate-500 truncate">
                          {item.keterangan}
                        </span>
                      )}
                    </span>
                  </a>
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
              <MateriGuruForm
                kelas={kelas}
                kategori={kategori}
                existingCount={items.length}
                onCancel={() => setFormFor(null)}
                onSaved={(created) => {
                  setList((prev) => [...prev, created]);
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
              Tambah Materi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
