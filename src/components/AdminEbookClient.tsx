"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import { materiFileViewUrl } from "@/lib/file-types";
import AttachmentPicker from "@/components/materi/AttachmentPicker";
import type { Ebook, EbookJenis } from "@/types/ebook";
import type { Kelas } from "@/types/materi";
import { Plus, Pencil, Trash2, Loader2, Paperclip, X, Check } from "lucide-react";

const JENIS_LIST: { value: EbookJenis; label: string }[] = [
  { value: "guru", label: "Pegangan Guru" },
  { value: "siswa", label: "Pegangan Siswa" },
];

function EbookForm({
  jenis,
  kelas,
  existingCount,
  initial,
  onCancel,
  onSaved,
}: {
  jenis: EbookJenis;
  kelas: Kelas;
  existingCount: number;
  initial?: Ebook;
  onCancel: () => void;
  onSaved: (item: Ebook) => void;
}) {
  const [judul, setJudul] = useState(initial?.judul ?? "");
  const [fileUrl, setFileUrl] = useState<string | null>(initial?.file_url ?? null);
  const [fileName, setFileName] = useState<string | null>(initial?.file_name ?? null);
  const [fileType, setFileType] = useState<string | null>(initial?.file_type ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim()) {
      setError("Judul wajib diisi.");
      return;
    }
    if (!fileUrl) {
      setError("Unggah file atau tempel link dulu.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      jenis,
      kelas,
      judul,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      urutan: initial?.urutan ?? existingCount,
    };

    const query = initial
      ? supabase.from("ebook").update(payload).eq("id", initial.id).select().single()
      : supabase.from("ebook").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan e-book.");
      return;
    }
    onSaved(data as Ebook);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Judul E-book</label>
        <input
          autoFocus
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder={`Buku ${jenis === "guru" ? "Guru" : "Siswa"} Informatika ${kelasLabel(kelas)}`}
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">File</label>
        <AttachmentPicker
          fileUrl={fileUrl}
          fileName={fileName}
          onAttached={(v) => {
            setFileUrl(v.fileUrl);
            setFileName(v.fileName);
            setFileType(v.fileType);
          }}
          onRemoved={() => {
            setFileUrl(null);
            setFileName(null);
            setFileType(null);
          }}
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

export default function AdminEbookClient({ ebookAwal }: { ebookAwal: Ebook[] }) {
  const [ebookList, setEbookList] = useState<Ebook[]>(ebookAwal);
  const [jenis, setJenis] = useState<EbookJenis>("siswa");
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [formFor, setFormFor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = ebookList
    .filter((e) => e.jenis === jenis && e.kelas === kelas)
    .sort((a, b) => a.urutan - b.urutan);

  async function handleDelete(item: Ebook) {
    if (!confirm(`Hapus e-book "${item.judul}"?`)) return;
    setBusyId(item.id);
    const supabase = createClient();
    const { error } = await supabase.from("ebook").delete().eq("id", item.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setEbookList((prev) => prev.filter((e) => e.id !== item.id));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">E-book</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola e-book pegangan guru dan pegangan siswa per kelas
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-3">
        {JENIS_LIST.map((j) => (
          <button
            key={j.value}
            onClick={() => setJenis(j.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              jenis === j.value
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {j.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6">
        {KELAS_LIST.map((k) => (
          <button
            key={k}
            onClick={() => setKelas(k)}
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

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {items.length === 0 && formFor !== "new" && (
          <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
            Belum ada e-book {JENIS_LIST.find((j) => j.value === jenis)?.label.toLowerCase()} untuk{" "}
            {kelasLabel(kelas)}.
          </p>
        )}

        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-3">
              {formFor === item.id ? (
                <EbookForm
                  jenis={jenis}
                  kelas={kelas}
                  existingCount={items.length}
                  initial={item}
                  onCancel={() => setFormFor(null)}
                  onSaved={(updated) => {
                    setEbookList((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
                    setFormFor(null);
                  }}
                />
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <a
                    href={materiFileViewUrl(item.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 min-w-0 truncate"
                  >
                    <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
                    {item.judul}
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
              <EbookForm
                jenis={jenis}
                kelas={kelas}
                existingCount={items.length}
                onCancel={() => setFormFor(null)}
                onSaved={(created) => {
                  setEbookList((prev) => [...prev, created]);
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
              Tambah E-book
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
