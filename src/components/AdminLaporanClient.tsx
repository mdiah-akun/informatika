"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import { JENIS_LIST } from "@/lib/soal-jenis";
import { sanitizeRichText } from "@/lib/sanitize-html";
import type { SoalAttempt, SoalJenis } from "@/types/soal";
import type { SoalEssai, SoalEssaiAttempt } from "@/types/soal-essai";
import type { Kelas } from "@/types/materi";
import { Search, RotateCcw, Loader2, ShieldAlert, CheckCircle2, Clock3, Eye, X, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

export type LaporanRow = SoalAttempt & { nama: string; rombel: string | null };
export type LaporanEssaiRow = SoalEssaiAttempt & { nama: string; rombel: string | null };

const TIPE_LIST: { value: "pilihan_ganda" | "essai"; label: string }[] = [
  { value: "pilihan_ganda", label: "Pilihan Ganda" },
  { value: "essai", label: "Essai" },
];

function formatTanggal(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminLaporanClient({
  laporanAwal,
  laporanEssaiAwal,
  soalEssaiList,
}: {
  laporanAwal: LaporanRow[];
  laporanEssaiAwal: LaporanEssaiRow[];
  soalEssaiList: SoalEssai[];
}) {
  const [laporan, setLaporan] = useState<LaporanRow[]>(laporanAwal);
  const [laporanEssai, setLaporanEssai] = useState<LaporanEssaiRow[]>(laporanEssaiAwal);
  const [tipeAktif, setTipeAktif] = useState<"pilihan_ganda" | "essai">("pilihan_ganda");
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [jenis, setJenis] = useState<SoalJenis>("harian");
  const [search, setSearch] = useState("");
  const [resetTarget, setResetTarget] = useState<LaporanRow | null>(null);
  const [resetEssaiTarget, setResetEssaiTarget] = useState<LaporanEssaiRow | null>(null);
  const [lihatJawabanTarget, setLihatJawabanTarget] = useState<LaporanEssaiRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mengoreksi, setMengoreksi] = useState(false);
  const [koreksiError, setKoreksiError] = useState<string | null>(null);

  const [rombel, setRombel] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rowsAktif: { kelas: Kelas; jenis: SoalJenis; rombel: string | null }[] =
    tipeAktif === "pilihan_ganda" ? laporan : laporanEssai;
  const rombelOptions = Array.from(
    new Set(
      rowsAktif
        .filter((r) => r.kelas === kelas && r.jenis === jenis)
        .map((r) => r.rombel)
        .filter((v): v is string => !!v)
    )
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const semuaItems = laporan
    .filter((r) => r.kelas === kelas && r.jenis === jenis)
    .filter((r) => !rombel || r.rombel === rombel)
    .filter((r) => r.nama.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.mulai_at).getTime() - new Date(a.mulai_at).getTime());

  const semuaItemsEssai = laporanEssai
    .filter((r) => r.kelas === kelas && r.jenis === jenis)
    .filter((r) => !rombel || r.rombel === rombel)
    .filter((r) => r.nama.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.mulai_at).getTime() - new Date(a.mulai_at).getTime());

  const totalItems = tipeAktif === "pilihan_ganda" ? semuaItems.length : semuaItemsEssai.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const items = semuaItems.slice(offset, offset + pageSize);
  const itemsEssai = semuaItemsEssai.slice(offset, offset + pageSize);

  function resetFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  function renderPagination() {
    if (totalItems === 0) return null;
    const dari = offset + 1;
    const sampai = Math.min(offset + pageSize, totalItems);
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Menampilkan {dari}-{sampai} dari {totalItems}
          </span>
          <select
            value={pageSize}
            onChange={(e) => resetFilter(() => setPageSize(Number(e.target.value)))}
            className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-700 dark:text-slate-200"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / halaman
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Sebelumnya
          </button>
          <span className="px-2 text-xs">
            Halaman {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Berikutnya
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  async function handleReset() {
    if (!resetTarget) return;
    setBusyId(resetTarget.id);
    const supabase = createClient();
    const { error } = await supabase.from("soal_attempt").delete().eq("id", resetTarget.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setLaporan((prev) => prev.filter((r) => r.id !== resetTarget.id));
    setResetTarget(null);
  }

  async function handleResetEssai() {
    if (!resetEssaiTarget) return;
    setBusyId(resetEssaiTarget.id);
    const supabase = createClient();
    const { error } = await supabase.from("soal_essai_attempt").delete().eq("id", resetEssaiTarget.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setLaporanEssai((prev) => prev.filter((r) => r.id !== resetEssaiTarget.id));
    setResetEssaiTarget(null);
  }

  async function handleKoreksi() {
    if (!lihatJawabanTarget) return;
    setMengoreksi(true);
    setKoreksiError(null);
    const res = await fetch("/api/soal-essai/koreksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId: lihatJawabanTarget.id }),
    });
    const json = await res.json();
    setMengoreksi(false);
    if (!res.ok) {
      setKoreksiError(json.error ?? "Gagal mengoreksi jawaban.");
      return;
    }
    const updated: LaporanEssaiRow = {
      ...lihatJawabanTarget,
      skor: json.skor,
      skor_total: json.skorTotal,
      dikoreksi_at: new Date().toISOString(),
    };
    setLihatJawabanTarget(updated);
    setLaporanEssai((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Laporan Ujian</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Daftar siswa yang sudah mengerjakan soal, beserta nilai dan status pelanggaran
        </p>
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        {TIPE_LIST.map((t) => (
          <button
            key={t.value}
            onClick={() =>
              resetFilter(() => {
                setTipeAktif(t.value);
                setRombel("");
              })
            }
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tipeAktif === t.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-3">
        {JENIS_LIST.map((j) => (
          <button
            key={j.value}
            onClick={() =>
              resetFilter(() => {
                setJenis(j.value);
                setRombel("");
              })
            }
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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          {KELAS_LIST.map((k) => (
            <button
              key={k}
              onClick={() =>
                resetFilter(() => {
                  setKelas(k);
                  setRombel("");
                })
              }
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

        <select
          value={rombel}
          onChange={(e) => resetFilter(() => setRombel(e.target.value))}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Semua Kelas {kelasLabel(kelas).replace("Kelas ", "")}</option>
          {rombelOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => resetFilter(() => setSearch(e.target.value))}
            placeholder="Cari nama siswa..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {tipeAktif === "pilihan_ganda" ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 text-left text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium w-10">No</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Kelas</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Mulai</th>
                  <th className="px-4 py-3 font-medium">Selesai</th>
                  <th className="px-4 py-3 font-medium">Benar</th>
                  <th className="px-4 py-3 font-medium">Skor</th>
                  <th className="px-4 py-3 font-medium">Pelanggaran</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                      Belum ada siswa yang mengerjakan {JENIS_LIST.find((j) => j.value === jenis)?.label} untuk{" "}
                      {kelasLabel(kelas)}.
                    </td>
                  </tr>
                ) : (
                  items.map((r, idx) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700"
                    >
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{offset + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{r.nama}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.rombel || "-"}</td>
                      <td className="px-4 py-3">
                        {r.status === "selesai" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Clock3 className="h-3 w-3" />
                            Berjalan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{formatTanggal(r.mulai_at)}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{formatTanggal(r.selesai_at)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {r.jumlah_benar ?? "-"} / {r.jumlah_soal ?? "-"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{r.skor ?? "-"}</td>
                      <td className="px-4 py-3">
                        {r.jumlah_pelanggaran > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {r.jumlah_pelanggaran}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setResetTarget(r)}
                          disabled={busyId === r.id}
                          title="Reset Ujian"
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                          {busyId === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 text-left text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium w-10">No</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Kelas</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Mulai</th>
                  <th className="px-4 py-3 font-medium">Selesai</th>
                  <th className="px-4 py-3 font-medium">Skor</th>
                  <th className="px-4 py-3 font-medium">Pelanggaran</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {itemsEssai.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                      Belum ada siswa yang mengerjakan essai {JENIS_LIST.find((j) => j.value === jenis)?.label} untuk{" "}
                      {kelasLabel(kelas)}.
                    </td>
                  </tr>
                ) : (
                  itemsEssai.map((r, idx) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700"
                    >
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{offset + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{r.nama}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.rombel || "-"}</td>
                      <td className="px-4 py-3">
                        {r.status === "selesai" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Clock3 className="h-3 w-3" />
                            Berjalan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{formatTanggal(r.mulai_at)}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{formatTanggal(r.selesai_at)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {r.skor_total ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {r.jumlah_pelanggaran > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {r.jumlah_pelanggaran}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setKoreksiError(null);
                              setLihatJawabanTarget(r);
                            }}
                            title="Lihat Jawaban"
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Lihat Jawaban
                          </button>
                          <button
                            onClick={() => setResetEssaiTarget(r)}
                            disabled={busyId === r.id}
                            title="Reset Ujian"
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                          >
                            {busyId === r.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Reset ujian siswa ini?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Jawaban dan nilai <span className="font-medium text-slate-700 dark:text-slate-200">{resetTarget.nama}</span>{" "}
              untuk {JENIS_LIST.find((j) => j.value === jenis)?.label} akan dihapus permanen, dan siswa bisa
              mengerjakan ulang dari awal.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResetTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {resetEssaiTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Reset ujian essai siswa ini?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Jawaban{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">{resetEssaiTarget.nama}</span> untuk{" "}
              {JENIS_LIST.find((j) => j.value === jenis)?.label} (Essai) akan dihapus permanen, dan siswa bisa
              mengerjakan ulang dari awal.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResetEssaiTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleResetEssai}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {lihatJawabanTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-4xl w-full shadow-xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between mb-1.5 shrink-0">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Jawaban Essai &middot; {lihatJawabanTarget.nama}
                </h3>
                {lihatJawabanTarget.skor_total !== null && lihatJawabanTarget.skor_total !== undefined && (
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    Skor Total: {lihatJawabanTarget.skor_total}
                  </p>
                )}
              </div>
              <button onClick={() => setLihatJawabanTarget(null)}>
                <X className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2 mb-1 shrink-0">
              <button
                onClick={handleKoreksi}
                disabled={mengoreksi}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 text-white text-sm font-medium px-3.5 py-1.5 hover:bg-purple-700 disabled:opacity-60"
              >
                {mengoreksi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {lihatJawabanTarget.dikoreksi_at ? "Koreksi Ulang (AI)" : "Koreksi Otomatis (AI)"}
              </button>
              {lihatJawabanTarget.dikoreksi_at && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Terakhir dikoreksi {formatTanggal(lihatJawabanTarget.dikoreksi_at)}
                </span>
              )}
            </div>
            {koreksiError && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{koreksiError}</p>}

            <div className="flex-1 overflow-y-auto space-y-4 mt-3 pr-1">
              {soalEssaiList
                .filter((s) => s.kelas === lihatJawabanTarget.kelas && s.jenis === lihatJawabanTarget.jenis)
                .sort((a, b) => a.urutan - b.urutan)
                .map((s, idx) => {
                  const hasilSkor = lihatJawabanTarget.skor?.[s.id];
                  return (
                    <div key={s.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div
                          className="text-sm font-medium text-slate-800 dark:text-slate-200 prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: sanitizeRichText(`${idx + 1}. ${s.pertanyaan}`) }}
                        />
                        {hasilSkor && (
                          <span className="shrink-0 inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2.5 py-1 text-xs font-semibold">
                            {hasilSkor.skor} / {s.skor_maksimal}
                          </span>
                        )}
                      </div>
                      <div className="rounded-md bg-slate-50 dark:bg-slate-700/40 px-3 py-2">
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Jawaban Siswa
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                          {lihatJawabanTarget.jawaban[s.id]?.trim() || (
                            <span className="text-slate-400 dark:text-slate-500 italic">Tidak dijawab</span>
                          )}
                        </p>
                      </div>
                      {hasilSkor?.alasan && (
                        <div className="mt-2 rounded-md border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 px-3 py-2">
                          <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 mb-1">
                            Analisis AI
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-200">{hasilSkor.alasan}</p>
                        </div>
                      )}
                      <div className="mt-2 rounded-md border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2">
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                          Kunci Jawaban
                        </p>
                        <div
                          className="text-sm text-slate-700 dark:text-slate-200 prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: sanitizeRichText(s.kunci_jawaban) }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
            <button
              onClick={() => setLihatJawabanTarget(null)}
              className="w-full mt-4 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 shrink-0"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
