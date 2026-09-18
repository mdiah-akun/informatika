"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TP_LIST } from "@/lib/soal-tp";
import { JENIS_LIST } from "@/lib/soal-jenis";
import type { Soal, SoalJenis, KunciJawaban } from "@/types/soal";
import type { Kelas } from "@/types/materi";
import { Upload, Loader2, X, Check, AlertTriangle } from "lucide-react";

const OPSI_LABELS: KunciJawaban[] = ["A", "B", "C", "D"];

type ReviewRow = {
  key: string;
  include: boolean;
  pertanyaan: string;
  opsi: Record<KunciJawaban, string>;
  kunci: KunciJawaban | "";
  lengkap: boolean;
};

export default function SoalImportModal({
  kelas,
  defaultJenis,
  existingCount,
  onCancel,
  onImported,
}: {
  kelas: Kelas;
  defaultJenis: SoalJenis;
  existingCount: number;
  onCancel: () => void;
  onImported: (items: Soal[]) => void;
}) {
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [jenis, setJenis] = useState<SoalJenis>(defaultJenis);
  const [labelTp, setLabelTp] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleProses() {
    if (!file) {
      setError("Pilih file PDF dulu.");
      return;
    }
    setParsing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/soal/import-pdf", { method: "POST", body: formData });
    const json = await res.json();
    setParsing(false);

    if (!res.ok) {
      setError(json.error ?? "Gagal memproses file.");
      return;
    }

    setRows(
      (json.soal as { nomor: string; pertanyaan: string; opsi: Record<KunciJawaban, string>; lengkap: boolean }[]).map(
        (s) => ({
          key: s.nomor,
          include: true,
          pertanyaan: s.pertanyaan,
          opsi: s.opsi,
          kunci: "",
          lengkap: s.lengkap,
        })
      )
    );
    setStep("review");
  }

  function updateRow(key: string, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function updateOpsi(key: string, label: KunciJawaban, value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, opsi: { ...r.opsi, [label]: value } } : r)));
  }

  const includedRows = rows.filter((r) => r.include);
  const readyToSave =
    includedRows.length > 0 &&
    includedRows.every((r) => r.pertanyaan.trim() && r.kunci && OPSI_LABELS.every((l) => r.opsi[l].trim()));

  async function handleSimpan() {
    if (!readyToSave) {
      setError("Pastikan tiap soal yang disertakan punya pertanyaan, 4 opsi, dan kunci jawaban.");
      return;
    }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const payload = includedRows.map((r, idx) => ({
      kelas,
      jenis,
      label_tp: labelTp || null,
      pertanyaan: r.pertanyaan,
      gambar_soal_url: null,
      opsi_a: r.opsi.A,
      opsi_a_gambar_url: null,
      opsi_b: r.opsi.B,
      opsi_b_gambar_url: null,
      opsi_c: r.opsi.C,
      opsi_c_gambar_url: null,
      opsi_d: r.opsi.D,
      opsi_d_gambar_url: null,
      kunci_jawaban: r.kunci,
      urutan: existingCount + idx,
    }));

    const { data, error } = await supabase.from("soal").insert(payload).select();
    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan soal.");
      return;
    }
    onImported(data as Soal[]);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-3xl w-full shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-1.5 shrink-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Import Soal dari PDF</h3>
          <button onClick={onCancel}>
            <X className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        {step === "upload" ? (
          <div className="space-y-4 mt-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Unggah file PDF berisi soal pilihan ganda (nomor 1, 2, dst dengan opsi A/B/C/D). Kunci jawaban tidak ada
              di file soal, jadi akan diminta dipilih manual pada langkah berikutnya.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Jenis Soal</label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value as SoalJenis)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
              >
                {JENIS_LIST.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Label Soal (dari TP mana)
              </label>
              <select
                value={labelTp}
                onChange={(e) => setLabelTp(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
              >
                <option value="">Umum (tidak spesifik TP)</option>
                {TP_LIST.map((tp) => (
                  <option key={tp} value={tp}>
                    {tp}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Berlaku untuk semua soal dalam file ini.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">File PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 dark:file:bg-slate-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 dark:file:text-slate-200"
              />
            </div>

            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex items-center gap-2">
              <button
                onClick={handleProses}
                disabled={parsing || !file}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-60"
              >
                {parsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Proses File
              </button>
              <button
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm px-3 py-1.5 text-slate-600 dark:text-slate-300"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 flex-1 mt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 shrink-0">
              {rows.length} soal terdeteksi. Periksa dan pilih kunci jawaban tiap soal sebelum menyimpan. Hilangkan
              centang untuk melewati soal yang tidak ingin diimpor.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {rows.map((r) => (
                <div
                  key={r.key}
                  className={`rounded-lg border p-3 ${
                    !r.lengkap
                      ? "border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={r.include}
                      onChange={(e) => updateRow(r.key, { include: e.target.checked })}
                      className="accent-indigo-600 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          Soal No. {r.key}
                        </span>
                        {!r.lengkap && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            Periksa ulang, ada bagian yang mungkin tidak terbaca sempurna
                          </span>
                        )}
                      </div>
                      <textarea
                        value={r.pertanyaan}
                        onChange={(e) => updateRow(r.key, { pertanyaan: e.target.value })}
                        rows={2}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm mb-2"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {OPSI_LABELS.map((label) => (
                          <label
                            key={label}
                            className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1.5"
                          >
                            <input
                              type="radio"
                              name={`kunci-${r.key}`}
                              checked={r.kunci === label}
                              onChange={() => updateRow(r.key, { kunci: label })}
                              className="accent-indigo-600 shrink-0"
                            />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                              {label}.
                            </span>
                            <input
                              value={r.opsi[label]}
                              onChange={(e) => updateOpsi(r.key, label, e.target.value)}
                              className="w-full min-w-0 text-sm bg-transparent focus:outline-none text-slate-800 dark:text-slate-200"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-red-600 dark:text-red-400 mt-3 shrink-0">{error}</p>}

            <div className="flex items-center gap-2 mt-4 shrink-0">
              <button
                onClick={handleSimpan}
                disabled={saving || !readyToSave}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Impor {includedRows.length} Soal
              </button>
              <button
                onClick={() => setStep("upload")}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm px-3 py-1.5 text-slate-600 dark:text-slate-300"
              >
                Kembali
              </button>
              <button
                onClick={onCancel}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm px-3 py-1.5 text-slate-600 dark:text-slate-300"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
