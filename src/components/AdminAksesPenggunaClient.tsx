"use client";

import { useState } from "react";
import { getPageNumbers } from "@/lib/pagination";
import { compareRombel } from "@/lib/rombel";
import { Search } from "lucide-react";

export type BarisAkses = {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  punyaAkun: boolean;
  sudahLogin: boolean;
  terakhirLogin: string | null;
  jumlahLogin: number;
  jumlahAkses: number;
  terakhirAkses: string | null;
  menuTerakhir: string | null;
};

type FilterLogin = "semua" | "sudah" | "belum";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatWaktu(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  });
}

const selectClass =
  "rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function AdminAksesPenggunaClient({ baris, logSiap }: { baris: BarisAkses[]; logSiap: boolean }) {
  const [cari, setCari] = useState("");
  const [kelas, setKelas] = useState("semua");
  const [filterLogin, setFilterLogin] = useState<FilterLogin>("semua");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);

  const kelasOpsi = [...new Set(baris.map((b) => b.kelas))].sort(compareRombel);
  const sudah = baris.filter((b) => b.sudahLogin).length;

  const q = cari.trim().toLowerCase();
  const tampil = baris.filter((b) => {
    if (kelas !== "semua" && b.kelas !== kelas) return false;
    if (filterLogin === "sudah" && !b.sudahLogin) return false;
    if (filterLogin === "belum" && b.sudahLogin) return false;
    if (!q) return true;
    return b.nama.toLowerCase().includes(q) || b.nisn.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(tampil.length / pageSize));
  const halaman = Math.min(page, totalPages - 1);
  const potong = tampil.slice(halaman * pageSize, halaman * pageSize + pageSize);

  const th = "px-4 py-3 font-medium whitespace-nowrap";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Akses Pengguna</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Berapa kali siswa login dan membuka halaman, kapan terakhir mengakses, dan menu apa yang terakhir dibuka.
          Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      {!logSiap && (
        <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg px-3 py-2 mb-4">
          Tabel pencatat akses belum dibuat, jadi jumlah login dan menu terakhir belum bisa tampil. Jalankan
          supabase/add-akses-log-table.sql di Supabase SQL Editor. Status sudah/belum login tetap tampil dari data
          akun.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4 max-w-xl">
        {[
          { label: "Total siswa", nilai: baris.length },
          { label: "Sudah login", nilai: sudah },
          { label: "Belum login", nilai: baris.length - sudah },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{k.nilai}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            value={cari}
            onChange={(e) => {
              setCari(e.target.value);
              setPage(0);
            }}
            placeholder="Cari nama atau NISN..."
            className="w-full sm:w-72 rounded-lg border border-slate-300 dark:border-slate-600 pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={kelas}
          onChange={(e) => {
            setKelas(e.target.value);
            setPage(0);
          }}
          className={selectClass}
        >
          <option value="semua">Semua Kelas</option>
          {kelasOpsi.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          value={filterLogin}
          onChange={(e) => {
            setFilterLogin(e.target.value as FilterLogin);
            setPage(0);
          }}
          className={selectClass}
          title="Filter login"
        >
          <option value="semua">Semua (login)</option>
          <option value="sudah">Sudah pernah login</option>
          <option value="belum">Belum pernah login</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
          className={selectClass}
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
                <th className={`${th} w-12`}>No</th>
                <th className={th}>NISN</th>
                <th className={th}>Nama Siswa</th>
                <th className={th}>Kelas</th>
                <th className={th}>Status</th>
                <th className={`${th} text-center`}>Jml Login</th>
                <th className={`${th} text-center`}>Jml Akses</th>
                <th className={th}>Terakhir Login</th>
                <th className={th}>Terakhir Akses</th>
                <th className={th}>Menu Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {potong.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                    {baris.length === 0 ? "Belum ada data siswa." : "Tidak ada siswa yang cocok."}
                  </td>
                </tr>
              ) : (
                potong.map((b, i) => (
                  <tr
                    key={b.id}
                    className="border-b border-slate-100 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700"
                  >
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{halaman * pageSize + i + 1}</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{b.nisn || "-"}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{b.nama}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {b.kelas}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {b.sudahLogin ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          Sudah login
                        </span>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                          title={b.punyaAkun ? "Akun ada, belum pernah login" : "Siswa belum punya akun login"}
                        >
                          {b.punyaAkun ? "Belum login" : "Belum ada akun"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-700 dark:text-slate-300">{b.jumlahLogin}</td>
                    <td className="px-4 py-2.5 text-center text-slate-700 dark:text-slate-300">{b.jumlahAkses}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatWaktu(b.terakhirLogin)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatWaktu(b.terakhirAkses)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {b.menuTerakhir ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {tampil.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Halaman {halaman + 1} dari {totalPages} &middot; {tampil.length} siswa
            </p>
            <nav className="flex items-center gap-1 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={halaman === 0}
                className="px-2 py-1 font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40"
              >
                PREVIOUS
              </button>
              {getPageNumbers(halaman + 1, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="px-1.5 text-slate-400 dark:text-slate-500 select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p - 1)}
                    className={`h-7 w-7 rounded-full text-sm font-medium transition-colors ${
                      p === halaman + 1
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
                disabled={halaman >= totalPages - 1}
                className="px-2 py-1 font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40"
              >
                NEXT
              </button>
            </nav>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        &quot;Sudah login&quot; dibaca dari data akun, jadi berlaku juga untuk login sebelum fitur ini dipasang. Jumlah
        login, jumlah akses halaman, terakhir akses, dan menu terakhir baru terhitung sejak fitur ini aktif.
      </p>
    </div>
  );
}
