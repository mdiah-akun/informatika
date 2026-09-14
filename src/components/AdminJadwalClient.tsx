"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { JadwalPelajaran } from "@/types/jadwal";
import { Upload, Loader2, Trash2 } from "lucide-react";

export default function AdminJadwalClient({ jadwalAwal }: { jadwalAwal: JadwalPelajaran | null }) {
  const [jadwal, setJadwal] = useState<JadwalPelajaran | null>(jadwalAwal);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    setUploading(true);
    setError(null);

    const supabase = createClient();
    const path = `jadwal-${crypto.randomUUID()}.${file.name.split(".").pop() || "jpg"}`;

    const { error: uploadError } = await supabase.storage.from("materi-gambar").upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: pub } = supabase.storage.from("materi-gambar").getPublicUrl(path);

    const query = jadwal
      ? supabase.from("jadwal_pelajaran").update({ gambar_url: pub.publicUrl }).eq("id", jadwal.id).select().single()
      : supabase.from("jadwal_pelajaran").insert({ gambar_url: pub.publicUrl }).select().single();

    const { data, error } = await query;
    setUploading(false);
    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan jadwal.");
      return;
    }
    setJadwal(data as JadwalPelajaran);
  }

  async function handleRemove() {
    if (!jadwal) return;
    if (!confirm("Hapus gambar jadwal pelajaran?")) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("jadwal_pelajaran").delete().eq("id", jadwal.id);
    setUploading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setJadwal(null);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Jadwal Pelajaran</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Unggah gambar jadwal pelajaran -- berlaku untuk semua kelas, akan tampil ke siswa
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        {jadwal?.gambar_url ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={jadwal.gambar_url}
              alt="Jadwal Pelajaran"
              className="max-w-full rounded-lg border border-slate-200 dark:border-slate-700 mb-4"
            />
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Ganti Gambar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm font-medium px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 px-4 py-12 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer">
            {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8 text-slate-400" />}
            Belum ada jadwal -- klik untuk unggah gambar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
