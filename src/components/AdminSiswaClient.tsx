"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { getPageNumbers } from "@/lib/pagination";
import { TINGKAT_LIST, buildRombel, parseRombel, compareRombel, type Tingkat } from "@/lib/rombel";
import type { Siswa } from "@/types/siswa";
import { Plus, Pencil, Trash2, Loader2, Search, X, Check, Upload, FileSpreadsheet } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type ImportRow = { nisn: string | null; nama: string; kelas: string | null; error: string | null };

function findColumnKey(row: Record<string, unknown>, patterns: string[]): string | undefined {
  return Object.keys(row).find((k) => patterns.some((p) => k.toLowerCase().includes(p)));
}

const TINGKAT_ANGKA: Record<string, Tingkat> = { "7": "VII", "8": "VIII", "9": "IX" };

/** Terima berbagai format dari Excel: "VII.1", "vii.1", "7", "Kelas VII.2",
 *  dst -- kembalikan kode rombel baku ("VII.1") atau null kalau tidak
 *  dikenali. */
function parseKelasValue(raw: unknown): string | null {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/^KELAS\s*/, "")
    .replace(/^KLS\s*/, "")
    .trim();
  if (!s) return null;

  if (/^(VII|VIII|IX)(\.\d+)?$/.test(s)) return s;

  const match = s.match(/^([789])(?:[.\s]+(\d+))?$/);
  if (match) {
    const tingkat = TINGKAT_ANGKA[match[1]];
    return match[2] ? `${tingkat}.${match[2]}` : tingkat;
  }

  return null;
}

function processImportRows(raw: Record<string, unknown>[]): ImportRow[] {
  return raw
    .filter((r) => Object.values(r).some((v) => String(v ?? "").trim() !== ""))
    .map((r) => {
      const nisnKey = findColumnKey(r, ["nisn", "induk siswa", "no induk"]);
      const namaKey = findColumnKey(r, ["nama"]);
      const kelasKey = findColumnKey(r, ["kelas"]);

      const nisn = nisnKey ? String(r[nisnKey] ?? "").trim() || null : null;
      const nama = namaKey ? String(r[namaKey] ?? "").trim() : "";
      const kelas = kelasKey ? parseKelasValue(r[kelasKey]) : null;

      let error: string | null = null;
      if (!nama) error = "Nama kosong";
      else if (!kelas) error = "Kolom Kelas tidak dikenali (isi mis. VII.1, VIII.2, IX.3)";

      return { nisn, nama, kelas, error };
    });
}

function ImportExcelModal({
  onCancel,
  onImported,
}: {
  onCancel: () => void;
  onImported: (rows: Siswa[]) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    setReadError(null);
    setRows(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (raw.length === 0) {
        setReadError("File kosong atau tidak ada data yang terbaca.");
        return;
      }
      setRows(processImportRows(raw));
    } catch {
      setReadError("Gagal membaca file. Pastikan formatnya .xlsx, .xls, atau .csv.");
    }
  }

  const validRows = (rows ?? []).filter((r) => !r.error);
  const invalidRows = (rows ?? []).filter((r) => r.error);

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    setImportError(null);
    const supabase = createClient();

    const payload = validRows.map((r) => ({ nisn: r.nisn, nama: r.nama, kelas: r.kelas as string }));
    const CHUNK_SIZE = 500;
    const result: Siswa[] = [];

    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase.from("siswa").upsert(chunk, { onConflict: "nisn" }).select();
      if (error) {
        setImporting(false);
        setImportError(error.message);
        return;
      }
      result.push(...((data ?? []) as Siswa[]));
    }

    setImporting(false);
    onImported(result);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Import dari Excel</h3>
          <button onClick={onCancel}>
            <X className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Kolom yang dibaca (nama header bebas): <strong>NISN</strong> / "Nomor Induk Siswa" (opsional),{" "}
          <strong>Nama</strong>, <strong>Kelas</strong> (isi rombel lengkap mis. VII.1, VIII.2, IX.3 -- atau cukup
          7/8/9 kalau belum dipisah per rombel). Siswa dengan NISN yang sudah ada akan diperbarui datanya, bukan
          diduplikasi.
        </p>

        {!rows && (
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 px-4 py-8 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer">
            <FileSpreadsheet className="h-8 w-8 text-slate-400" />
            {fileName ? `Membaca ${fileName}...` : "Pilih file .xlsx / .xls / .csv"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </label>
        )}

        {readError && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mt-3">
            {readError}
          </p>
        )}

        {rows && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">
                {fileName} &middot; {rows.length} baris terbaca
              </span>
              <button
                onClick={() => {
                  setRows(null);
                  setFileName(null);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Ganti file
              </button>
            </div>

            <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-2">
              {validRows.length} siswa siap diimport.
            </p>

            {invalidRows.length > 0 && (
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg px-3 py-2 mb-2">
                  {invalidRows.length} baris dilewati (tidak diimport):
                </p>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                  {invalidRows.map((r, i) => (
                    <div key={i} className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 flex justify-between gap-2">
                      <span className="truncate">{r.nama || "(nama kosong)"}</span>
                      <span className="text-amber-600 dark:text-amber-400 shrink-0">{r.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importError && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2">
                {importError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleImport}
                disabled={importing || validRows.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import {validRows.length} Siswa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SiswaForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Siswa;
  onCancel: () => void;
  onSaved: (siswa: Siswa) => void;
}) {
  const initialParsed = parseRombel(initial?.kelas ?? "VII");
  const [nisn, setNisn] = useState(initial?.nisn ?? "");
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [tingkat, setTingkat] = useState<Tingkat>(initialParsed.tingkat);
  const [nomorRombel, setNomorRombel] = useState(initialParsed.nomor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = { nisn: nisn.trim() || null, nama: nama.trim(), kelas: buildRombel(tingkat, nomorRombel) };

    const query = initial
      ? supabase.from("siswa").update(payload).eq("id", initial.id).select().single()
      : supabase.from("siswa").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      setError(
        error?.message.includes("duplicate") ? "NISN sudah dipakai siswa lain." : error?.message ?? "Gagal menyimpan."
      );
      return;
    }
    onSaved(data as Siswa);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {initial ? "Edit Siswa" : "Tambah Siswa"}
          </h3>
          <button onClick={onCancel}>
            <X className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">NISN</label>
            <input
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              placeholder="Opsional"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              Nama Siswa
            </label>
            <input
              autoFocus
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Tingkat</label>
              <select
                value={tingkat}
                onChange={(e) => setTingkat(e.target.value as Tingkat)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TINGKAT_LIST.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                Rombel
              </label>
              <input
                value={nomorRombel}
                onChange={(e) => setNomorRombel(e.target.value.replace(/\D/g, ""))}
                placeholder="1"
                inputMode="numeric"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
            Akan tersimpan sebagai: <strong>{buildRombel(tingkat, nomorRombel)}</strong>
          </p>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSiswaClient({ siswaAwal }: { siswaAwal: Siswa[] }) {
  const [siswaList, setSiswaList] = useState<Siswa[]>(siswaAwal);
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState<string>("semua");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Siswa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Siswa | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    const supabase = createClient();
    const { error } = await supabase.from("siswa").delete().eq("id", deleteTarget.id);
    setBusyId(null);
    if (error) {
      setError(error.message);
      setDeleteTarget(null);
      return;
    }
    setSiswaList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const kelasOptions = [...new Set(siswaList.map((s) => s.kelas))].sort(compareRombel);

  const filtered = siswaList.filter((s) => {
    if (kelasFilter !== "semua" && s.kelas !== kelasFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.nama.toLowerCase().includes(q) || (s.nisn ?? "").toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Data Siswa</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola daftar siswa per kelas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import Excel
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Cari nama atau NISN..."
            className="w-full sm:w-72 rounded-lg border border-slate-300 dark:border-slate-600 pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <select
          value={kelasFilter}
          onChange={(e) => {
            setKelasFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="semua">Semua Kelas</option>
          {kelasOptions.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} / halaman
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium w-12">No</th>
                <th className="px-4 py-3 font-medium">NISN</th>
                <th className="px-4 py-3 font-medium">Nama Siswa</th>
                <th className="px-4 py-3 font-medium">Kelas</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                    {siswaList.length === 0 ? "Belum ada data siswa." : "Tidak ada siswa yang cocok."}
                  </td>
                </tr>
              ) : (
                paginated.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700"
                  >
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {currentPage * pageSize + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.nisn || "-"}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{s.nama}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(s);
                            setShowForm(true);
                          }}
                          title="Edit"
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          disabled={busyId === s.id}
                          title="Hapus"
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                        >
                          {busyId === s.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Halaman {currentPage + 1} dari {totalPages} &middot; {filtered.length} siswa
            </p>
            <nav className="flex items-center gap-1 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-2 py-1 font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-500 dark:disabled:hover:text-slate-400"
              >
                PREVIOUS
              </button>

              {getPageNumbers(currentPage + 1, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1.5 text-slate-400 dark:text-slate-500 select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p - 1)}
                    className={`h-7 w-7 rounded-full text-sm font-medium transition-colors ${
                      p === currentPage + 1
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-2 py-1 font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-500 dark:disabled:hover:text-slate-400"
              >
                NEXT
              </button>
            </nav>
          </div>
        )}
      </div>

      {showImport && (
        <ImportExcelModal
          onCancel={() => setShowImport(false)}
          onImported={(imported) => {
            setSiswaList((prev) => {
              const byId = new Map(prev.map((s) => [s.id, s]));
              for (const row of imported) byId.set(row.id, row);
              return [...byId.values()];
            });
            setShowImport(false);
          }}
        />
      )}

      {showForm && (
        <SiswaForm
          initial={editing ?? undefined}
          onCancel={() => setShowForm(false)}
          onSaved={(saved) => {
            setSiswaList((prev) =>
              editing ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved]
            );
            setShowForm(false);
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Hapus siswa ini?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Data <span className="font-medium text-slate-700 dark:text-slate-200">{deleteTarget.nama}</span> akan
              dihapus permanen.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
