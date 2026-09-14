"use client";

import { useState } from "react";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/client";
import { guessContentTypeByName, materiFileViewUrl } from "@/lib/file-types";
import { Paperclip, Upload, Link as LinkIcon, Loader2, X } from "lucide-react";

export type Attachment = { fileUrl: string; fileName: string; fileType: string | null };

/** Browser kadang tidak mengisi file.type dengan benar (mis. .html jadi
 *  kosong di beberapa OS/browser), padahal storage butuh Content-Type
 *  yang tepat supaya file HTML/gambar bisa disajikan dengan benar. */
function guessContentType(file: File): string | undefined {
  return guessContentTypeByName(file.name, file.type || undefined);
}

/** Cari file HTML utama di dalam zip: index.html di root, kalau tidak ada
 *  ambil index.html di folder manapun, kalau masih tidak ada ambil file
 *  .html pertama yang ditemukan. */
function findEntryHtmlPath(paths: string[]): string | null {
  const htmlPaths = paths.filter((p) => /\.html?$/i.test(p));
  if (htmlPaths.length === 0) return null;
  const rootIndex = htmlPaths.find((p) => p.toLowerCase() === "index.html");
  if (rootIndex) return rootIndex;
  const anyIndex = htmlPaths.find((p) => p.toLowerCase().endsWith("/index.html"));
  if (anyIndex) return anyIndex;
  return htmlPaths.sort((a, b) => a.split("/").length - b.split("/").length)[0];
}

/** Kontrol unggah file (termasuk ZIP berisi HTML+aset) atau tempel link
 *  (halaman web, YouTube, atau path di folder public/). Dipakai untuk
 *  lampiran materi, sub-materi, maupun e-book. */
export default function AttachmentPicker({
  fileUrl,
  fileName,
  onAttached,
  onRemoved,
}: {
  fileUrl: string | null;
  fileName: string | null;
  onAttached: (v: Attachment) => void;
  onRemoved: () => void;
}) {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");

  function handleUseLink() {
    const url = linkInput.trim();
    if (!url) return;

    // Selain URL lengkap (https://...), path relatif yang diawali "/" juga
    // diterima -- ini dipakai untuk file statis yang ditaruh di folder
    // public/ project ini sendiri (mis. "/kelas9/bahan-ajar/bab1/index.html"),
    // supaya tidak perlu diubah lagi setelah pindah dari localhost ke
    // domain Vercel.
    const isRelativePath = url.startsWith("/");
    if (!isRelativePath) {
      try {
        new URL(url);
      } catch {
        setFileError("Link tidak valid. Pastikan diawali https:// atau /.");
        return;
      }
    }
    setFileError(null);
    onAttached({ fileUrl: url, fileName: url, fileType: null });
    setLinkInput("");
  }

  async function handleZipUpload(file: File) {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter((f) => !f.dir);
    if (entries.length === 0) {
      throw new Error("File ZIP kosong.");
    }

    const entryHtmlPath = findEntryHtmlPath(entries.map((f) => f.name));
    if (!entryHtmlPath) {
      throw new Error("Tidak ada file .html di dalam ZIP.");
    }

    const supabase = createClient();
    const folder = crypto.randomUUID();

    for (const entry of entries) {
      const blob = await entry.async("blob");
      const contentType = guessContentTypeByName(entry.name, blob.type);
      const { error } = await supabase.storage
        .from("materi-file")
        .upload(`${folder}/${entry.name}`, blob, { contentType });
      if (error) {
        throw new Error(`Gagal unggah ${entry.name}: ${error.message}`);
      }
    }

    const { data } = supabase.storage.from("materi-file").getPublicUrl(`${folder}/${entryHtmlPath}`);
    onAttached({ fileUrl: data.publicUrl, fileName: file.name, fileType: "text/html" });
  }

  async function handleSingleFileUpload(file: File) {
    const supabase = createClient();

    const ext = file.name.split(".").pop() || "bin";
    const path = `${crypto.randomUUID()}.${ext}`;
    const contentType = guessContentType(file);

    const { error } = await supabase.storage.from("materi-file").upload(path, file, {
      contentType,
    });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from("materi-file").getPublicUrl(path);
    onAttached({ fileUrl: data.publicUrl, fileName: file.name, fileType: contentType ?? null });
  }

  async function handleFileUpload(file: File) {
    setUploadingFile(true);
    setFileError(null);

    try {
      if (file.name.toLowerCase().endsWith(".zip")) {
        await handleZipUpload(file);
      } else {
        await handleSingleFileUpload(file);
      }
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Gagal mengunggah file.");
    }

    setUploadingFile(false);
  }

  if (fileUrl) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm">
        <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
        <a
          href={materiFileViewUrl(fileUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-0 truncate text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {fileName}
        </a>
        <button
          type="button"
          onClick={onRemoved}
          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 shrink-0"
          title="Hapus lampiran"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Unggah File
          <input
            type="file"
            accept=".pdf,.html,.htm,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            className="hidden"
            disabled={uploadingFile}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
        </label>

        <span className="text-xs text-slate-400">atau</span>

        <input
          type="url"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleUseLink();
            }
          }}
          placeholder="Tempel link (halaman web / video YouTube)"
          className="flex-1 min-w-[220px] rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handleUseLink}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <LinkIcon className="h-4 w-4" />
          Gunakan Link
        </button>
      </div>
      {fileError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fileError}</p>}
    </div>
  );
}
