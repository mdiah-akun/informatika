"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slug";
import { materiFileViewUrl } from "@/lib/file-types";
import { cropImageToBlob } from "@/lib/image-crop";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import AttachmentPicker from "./AttachmentPicker";
import type { Bab, Kelas, Materi, MateriLampiran } from "@/types/materi";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  X,
  Check,
  Paperclip,
  ImageIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

function uniqueSlug(judul: string, existing: Materi[], excludeId?: string): string {
  const base = slugify(judul) || "materi";
  const taken = new Set(existing.filter((m) => m.id !== excludeId).map((m) => m.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function BabForm({
  initial,
  kelas,
  onCancel,
  onSaved,
}: {
  initial?: Bab;
  kelas: Kelas;
  onCancel: () => void;
  onSaved: (bab: Bab) => void;
}) {
  const [judul, setJudul] = useState(initial?.judul ?? "");
  const [urutan, setUrutan] = useState(initial?.urutan ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const query = initial
      ? supabase.from("bab").update({ judul, urutan }).eq("id", initial.id).select().single()
      : supabase.from("bab").insert({ judul, urutan, kelas }).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan bab.");
      return;
    }
    onSaved(data as Bab);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-3"
    >
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Judul Bab</label>
        <input
          autoFocus
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          placeholder="Bab 1 - Berpikir Komputasional"
        />
      </div>
      <div className="w-24">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Urutan</label>
        <input
          type="number"
          value={urutan}
          onChange={(e) => setUrutan(Number(e.target.value))}
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
      </div>
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
      {!initial && <span className="text-xs text-slate-400 self-center">akan dibuat untuk {kelasLabel(kelas)}</span>}
      {error && <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function MateriForm({
  babId,
  initial,
  existingMateri,
  onCancel,
  onSaved,
}: {
  babId: string;
  initial?: Materi;
  existingMateri: Materi[];
  onCancel: () => void;
  onSaved: (materi: Materi) => void;
}) {
  const [judul, setJudul] = useState(initial?.judul ?? "");
  const [konten, setKonten] = useState(initial?.konten ?? "");
  const [urutan, setUrutan] = useState(initial?.urutan ?? 0);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [gambarUrl, setGambarUrl] = useState<string | null>(initial?.gambar_url ?? null);
  const [uploadingGambar, setUploadingGambar] = useState(false);
  const [gambarError, setGambarError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(initial?.file_url ?? null);
  const [fileName, setFileName] = useState<string | null>(initial?.file_name ?? null);
  const [fileType, setFileType] = useState<string | null>(initial?.file_type ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGambarUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setGambarError("File harus berupa gambar.");
      return;
    }
    setUploadingGambar(true);
    setGambarError(null);

    try {
      const cropped = await cropImageToBlob(file);
      const supabase = createClient();
      const path = `${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage
        .from("materi-gambar")
        .upload(path, cropped, { contentType: "image/jpeg" });
      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from("materi-gambar").getPublicUrl(path);
      setGambarUrl(data.publicUrl);
    } catch (err) {
      setGambarError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    }

    setUploadingGambar(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim()) {
      setError("Judul wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const slug = initial?.slug ?? uniqueSlug(judul, existingMateri);
    const payload = {
      bab_id: babId,
      judul,
      slug,
      konten,
      urutan,
      published,
      gambar_url: gambarUrl,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
    };

    const query = initial
      ? supabase.from("materi").update(payload).eq("id", initial.id).select().single()
      : supabase.from("materi").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan materi.");
      return;
    }
    onSaved(data as Materi);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
    >
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Judul Materi
          </label>
          <input
            autoFocus
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
            placeholder="1.1 Konsep Algoritma"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Urutan</label>
          <input
            type="number"
            value={urutan}
            onChange={(e) => setUrutan(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 self-end pb-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          Terbitkan
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          Deskripsi Singkat
        </label>
        <textarea
          value={konten}
          onChange={(e) => setKonten(e.target.value)}
          rows={3}
          placeholder="Ringkasan singkat isi materi ini, ditampilkan di daftar materi..."
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          Gambar Sampul (opsional)
        </label>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">
          Ditampilkan di samping deskripsi singkat pada daftar materi. Otomatis di-crop & dikompres.
        </p>
        {gambarUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gambarUrl} alt="Gambar sampul" className="h-16 w-20 object-cover rounded-md border border-slate-300 dark:border-slate-600" />
            <button
              type="button"
              onClick={() => setGambarUrl(null)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
              Hapus Gambar
            </button>
          </div>
        ) : (
          <label className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            {uploadingGambar ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            Unggah Gambar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingGambar}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleGambarUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {gambarError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{gambarError}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          Lampiran Utama (opsional)
        </label>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">
          Unggah file (PDF/HTML/dll -- kalau HTML pakai gambar/CSS/JS terpisah, kompres semuanya jadi{" "}
          <strong>.zip</strong> berisi index.html), atau tempel link: halaman web yang sudah online (mis. dari
          Vercel), video YouTube, atau path file di folder <code>public/</code> project ini sendiri (mis.{" "}
          <code>/kelas9/bahan-ajar/bab1/index.html</code>). Untuk video/tugas tambahan, gunakan bagian{" "}
          <strong>Sub Materi</strong> setelah materi ini disimpan.
        </p>
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

function SubMateriForm({
  materiId,
  initial,
  existingCount,
  onCancel,
  onSaved,
}: {
  materiId: string;
  initial?: MateriLampiran;
  existingCount: number;
  onCancel: () => void;
  onSaved: (item: MateriLampiran) => void;
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
      materi_id: materiId,
      judul,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      urutan: initial?.urutan ?? existingCount,
    };

    const query = initial
      ? supabase.from("materi_lampiran").update(payload).eq("id", initial.id).select().single()
      : supabase.from("materi_lampiran").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan sub materi.");
      return;
    }
    onSaved(data as MateriLampiran);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3"
    >
      <input
        autoFocus
        value={judul}
        onChange={(e) => setJudul(e.target.value)}
        placeholder="Judul sub materi (mis. Video Penjelasan, Tugas Latihan)"
        className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
      />
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

export default function AdminMateriClient({
  babAwal,
  materiAwal,
  lampiranAwal,
}: {
  babAwal: Bab[];
  materiAwal: Materi[];
  lampiranAwal: MateriLampiran[];
}) {
  const [babList, setBabList] = useState<Bab[]>(babAwal);
  const [materiList, setMateriList] = useState<Materi[]>(materiAwal);
  const [lampiranList, setLampiranList] = useState<MateriLampiran[]>(lampiranAwal);
  const [selectedKelas, setSelectedKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [addingBab, setAddingBab] = useState(false);
  const [editingBabId, setEditingBabId] = useState<string | null>(null);
  const [materiFormFor, setMateriFormFor] = useState<{ babId: string; materiId: string | null } | null>(null);
  const [expandedMateriId, setExpandedMateriId] = useState<string | null>(null);
  const [subFormFor, setSubFormFor] = useState<{ materiId: string; subId: string | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDeleteBab(bab: Bab) {
    const jumlahMateri = materiList.filter((m) => m.bab_id === bab.id).length;
    if (
      !confirm(
        `Hapus bab "${bab.judul}"?${jumlahMateri > 0 ? ` ${jumlahMateri} materi di dalamnya akan ikut terhapus.` : ""}`
      )
    ) {
      return;
    }
    setBusyId(bab.id);
    const supabase = createClient();
    const { error } = await supabase.from("bab").delete().eq("id", bab.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    const removedMateriIds = new Set(materiList.filter((m) => m.bab_id === bab.id).map((m) => m.id));
    setBabList((prev) => prev.filter((b) => b.id !== bab.id));
    setMateriList((prev) => prev.filter((m) => m.bab_id !== bab.id));
    setLampiranList((prev) => prev.filter((l) => !removedMateriIds.has(l.materi_id)));
  }

  async function handleDeleteMateri(materi: Materi) {
    if (!confirm(`Hapus materi "${materi.judul}"?`)) return;
    setBusyId(materi.id);
    const supabase = createClient();
    const { error } = await supabase.from("materi").delete().eq("id", materi.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setMateriList((prev) => prev.filter((m) => m.id !== materi.id));
    setLampiranList((prev) => prev.filter((l) => l.materi_id !== materi.id));
  }

  async function handleTogglePublish(materi: Materi) {
    setBusyId(materi.id);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("materi")
      .update({ published: !materi.published })
      .eq("id", materi.id)
      .select()
      .single();
    setBusyId(null);
    if (error || !data) {
      alert(error?.message ?? "Gagal mengubah status.");
      return;
    }
    setMateriList((prev) => prev.map((m) => (m.id === materi.id ? (data as Materi) : m)));
  }

  async function handleDeleteLampiran(item: MateriLampiran) {
    if (!confirm(`Hapus sub materi "${item.judul}"?`)) return;
    setBusyId(item.id);
    const supabase = createClient();
    const { error } = await supabase.from("materi_lampiran").delete().eq("id", item.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setLampiranList((prev) => prev.filter((l) => l.id !== item.id));
  }

  const babForKelas = babList.filter((b) => b.kelas === selectedKelas).sort((a, b) => a.urutan - b.urutan);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Kelola Materi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Susun bab dan materi Informatika kelas VII, VIII, dan IX
          </p>
        </div>
        {!addingBab && (
          <button
            onClick={() => setAddingBab(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3.5 py-2 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Bab
          </button>
        )}
      </div>

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

      {addingBab && (
        <div className="mb-6">
          <BabForm
            kelas={selectedKelas}
            onCancel={() => setAddingBab(false)}
            onSaved={(bab) => {
              setBabList((prev) => [...prev, bab].sort((a, b) => a.urutan - b.urutan));
              setAddingBab(false);
            }}
          />
        </div>
      )}

      {babForKelas.length === 0 && !addingBab && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Belum ada bab untuk {kelasLabel(selectedKelas)}. Tambahkan bab pertama.
        </p>
      )}

      <div className="space-y-6">
        {babForKelas.map((bab) => {
          const items = materiList.filter((m) => m.bab_id === bab.id).sort((a, b) => a.urutan - b.urutan);
          return (
            <div
              key={bab.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
                {editingBabId === bab.id ? (
                  <BabForm
                    initial={bab}
                    kelas={bab.kelas}
                    onCancel={() => setEditingBabId(null)}
                    onSaved={(updated) => {
                      setBabList((prev) =>
                        prev.map((b) => (b.id === updated.id ? updated : b)).sort((a, b) => a.urutan - b.urutan)
                      );
                      setEditingBabId(null);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-200">{bab.judul}</h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingBabId(bab.id)}
                        className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                        title="Edit bab"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBab(bab)}
                        disabled={busyId === bab.id}
                        className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                        title="Hapus bab"
                      >
                        {busyId === bab.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.map((m) => {
                  const subItems = lampiranList
                    .filter((l) => l.materi_id === m.id)
                    .sort((a, b) => a.urutan - b.urutan);
                  const isExpanded = expandedMateriId === m.id;

                  return (
                    <li key={m.id} className="px-5 py-3">
                      {materiFormFor?.materiId === m.id ? (
                        <MateriForm
                          babId={bab.id}
                          initial={m}
                          existingMateri={materiList}
                          onCancel={() => setMateriFormFor(null)}
                          onSaved={(updated) => {
                            setMateriList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                            setMateriFormFor(null);
                          }}
                        />
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={() => setExpandedMateriId(isExpanded ? null : m.id)}
                              className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                              )}
                              {m.gambar_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.gambar_url}
                                  alt=""
                                  className="h-9 w-12 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm text-slate-700 dark:text-slate-200 truncate flex items-center gap-1.5">
                                  {m.judul}
                                  {m.file_url && <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                                  {subItems.length > 0 && (
                                    <span className="text-xs text-slate-400">({subItems.length} sub)</span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{m.konten.slice(0, 80)}</p>
                              </div>
                            </button>
                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  m.published
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                {m.published ? "Terbit" : "Draf"}
                              </span>
                              <button
                                onClick={() => handleTogglePublish(m)}
                                disabled={busyId === m.id}
                                className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                                title={m.published ? "Jadikan draf" : "Terbitkan"}
                              >
                                {m.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => setMateriFormFor({ babId: bab.id, materiId: m.id })}
                                className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                                title="Edit materi"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMateri(m)}
                                disabled={busyId === m.id}
                                className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                                title="Hapus materi"
                              >
                                {busyId === m.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 ml-6 pl-3 border-l-2 border-slate-100 dark:border-slate-700 space-y-2">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Sub Materi (video, tugas siswa, dll)
                              </p>
                              {subItems.map((item) =>
                                subFormFor?.subId === item.id ? (
                                  <SubMateriForm
                                    key={item.id}
                                    materiId={m.id}
                                    initial={item}
                                    existingCount={subItems.length}
                                    onCancel={() => setSubFormFor(null)}
                                    onSaved={(updated) => {
                                      setLampiranList((prev) =>
                                        prev.map((l) => (l.id === updated.id ? updated : l))
                                      );
                                      setSubFormFor(null);
                                    }}
                                  />
                                ) : (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-700/40 rounded-md px-3 py-2"
                                  >
                                    <a
                                      href={materiFileViewUrl(item.file_url)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 min-w-0 truncate"
                                    >
                                      <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                      {item.judul}
                                    </a>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => setSubFormFor({ materiId: m.id, subId: item.id })}
                                        className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                                        title="Edit sub materi"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLampiran(item)}
                                        disabled={busyId === item.id}
                                        className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                                        title="Hapus sub materi"
                                      >
                                        {busyId === item.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )
                              )}

                              {subFormFor?.materiId === m.id && subFormFor.subId === null ? (
                                <SubMateriForm
                                  materiId={m.id}
                                  existingCount={subItems.length}
                                  onCancel={() => setSubFormFor(null)}
                                  onSaved={(created) => {
                                    setLampiranList((prev) => [...prev, created]);
                                    setSubFormFor(null);
                                  }}
                                />
                              ) : (
                                <button
                                  onClick={() => setSubFormFor({ materiId: m.id, subId: null })}
                                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Tambah Sub Materi
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}

                {materiFormFor?.babId === bab.id && materiFormFor.materiId === null && (
                  <li className="px-5 py-3">
                    <MateriForm
                      babId={bab.id}
                      existingMateri={materiList}
                      onCancel={() => setMateriFormFor(null)}
                      onSaved={(created) => {
                        setMateriList((prev) => [...prev, created]);
                        setMateriFormFor(null);
                      }}
                    />
                  </li>
                )}
              </ul>

              {materiFormFor?.babId !== bab.id || materiFormFor?.materiId !== null ? (
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => setMateriFormFor({ babId: bab.id, materiId: null })}
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Materi
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
