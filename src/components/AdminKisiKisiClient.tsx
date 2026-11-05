"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import { materiFileViewUrl } from "@/lib/file-types";
import AttachmentPicker from "@/components/materi/AttachmentPicker";
import type { Kelas } from "@/types/materi";
import type { KisiKisi } from "@/types/kisi-kisi";
import { Plus, Pencil, Trash2, Loader2, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

function KisiForm({
  kelas,
  initial,
  urutanBaru,
  onCancel,
  onSaved,
}: {
  kelas: Kelas;
  initial?: KisiKisi;
  urutanBaru: number;
  onCancel: () => void;
  onSaved: (k: KisiKisi) => void;
}) {
  const [judul, setJudul] = useState(initial?.judul ?? "");
  const [isi, setIsi] = useState(initial?.isi ?? "");
  const [url, setUrl] = useState<string | null>(initial?.url ?? null);
  const [namaFile, setNamaFile] = useState<string | null>(initial?.url ?? null);
  const [urutan, setUrutan] = useState(initial?.urutan ?? urutanBaru);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = { judul: judul.trim(), isi, url, urutan };
    const query = initial
      ? supabase.from("kisi_kisi").update(payload).eq("id", initial.id).select().single()
      : supabase.from("kisi_kisi").insert({ ...payload, kelas }).select().single();
    const { data, error } = await query;
    setSaving(false);
    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan kisi-kisi.");
      return;
    }
    onSaved(data as KisiKisi);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-3"
    >
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Judul Kisi-kisi</label>
          <input
            autoFocus
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="mis. Kisi-kisi STS Ganjil"
            className={inputClass}
          />
        </div>
        <div className="w-20">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Urutan</label>
          <input
            type="number"
            value={urutan}
            onChange={(e) => setUrutan(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          Isi kisi-kisi (indikator, materi, bentuk soal, dll)
        </label>
        <textarea value={isi} onChange={(e) => setIsi(e.target.value)} rows={5} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          File / link (opsional): unggah PDF, atau tempel link / path seperti /kelas8/bahan-ajar/kisi.pdf
        </label>
        <AttachmentPicker
          fileUrl={url}
          fileName={namaFile}
          onAttached={(v) => {
            setUrl(v.fileUrl);
            setNamaFile(v.fileName);
          }}
          onRemoved={() => {
            setUrl(null);
            setNamaFile(null);
          }}
        />
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !judul.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3.5 py-2 hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 dark:border-slate-600 text-sm px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

export default function AdminKisiKisiClient({ kisiAwal }: { kisiAwal: KisiKisi[] }) {
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [kisiList, setKisiList] = useState<KisiKisi[]>(kisiAwal);
  const [formFor, setFormFor] = useState<{ kisiId: string | null } | null>(null);
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = kisiList.filter((k) => k.kelas === kelas).sort((a, b) => a.urutan - b.urutan);
  const tambahAktif = formFor?.kisiId === null;

  async function handleHapus(k: KisiKisi) {
    if (!confirm(`Hapus kisi-kisi "${k.judul}"?`)) return;
    setBusyId(k.id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("kisi_kisi").delete().eq("id", k.id);
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setKisiList((prev) => prev.filter((x) => x.id !== k.id));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Kisi-kisi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kisi-kisi untuk tiap kelas. Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
        {KELAS_LIST.map((k) => (
          <button
            key={k}
            onClick={() => {
              setKelas(k);
              setFormFor(null);
            }}
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

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {items.length === 0 && !tambahAktif && (
            <li className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
              Belum ada kisi-kisi untuk {kelasLabel(kelas)}.
            </li>
          )}
          {items.map((k) => {
            const buka = terbuka === k.id;
            return (
              <li key={k.id} className="px-5 py-3">
                {formFor?.kisiId === k.id ? (
                  <KisiForm
                    kelas={kelas}
                    initial={k}
                    urutanBaru={items.length}
                    onCancel={() => setFormFor(null)}
                    onSaved={(baru) => {
                      setKisiList((prev) => prev.map((x) => (x.id === baru.id ? baru : x)));
                      setFormFor(null);
                    }}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => setTerbuka(buka ? null : k.id)}
                        className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                      >
                        {buka ? (
                          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{k.judul}</p>
                          {k.isi && <p className="text-xs text-slate-400 truncate">{k.isi.slice(0, 80)}</p>}
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        {k.url && (
                          <a
                            href={materiFileViewUrl(k.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                            title="Buka link file"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => setFormFor({ kisiId: k.id })}
                          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                          title="Edit kisi-kisi"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleHapus(k)}
                          disabled={busyId === k.id}
                          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                          title="Hapus kisi-kisi"
                        >
                          {busyId === k.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    {buka && (
                      <div className="mt-3 ml-6 pl-3 border-l-2 border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                          {k.isi || "Belum ada isi."}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}

          {tambahAktif && (
            <li className="px-5 py-3">
              <KisiForm
                kelas={kelas}
                urutanBaru={items.length}
                onCancel={() => setFormFor(null)}
                onSaved={(baru) => {
                  setKisiList((prev) => [...prev, baru]);
                  setFormFor(null);
                }}
              />
            </li>
          )}
        </ul>

        {!tambahAktif && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setFormFor({ kisiId: null })}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Kisi-kisi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
