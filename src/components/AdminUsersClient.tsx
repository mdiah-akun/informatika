"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compareRombel } from "@/lib/rombel";
import { buildSiswaEmail } from "@/lib/siswa-account";
import type { Siswa } from "@/types/siswa";
import { Loader2, Search, Trash2, KeyRound, X, Check, RefreshCw, Copy, UserPlus } from "lucide-react";

function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

type ManagedUser = {
  id: string;
  email: string | null;
  nama: string;
  role: "admin" | "siswa";
  created_at: string;
  last_sign_in_at: string | null;
};

type ImportResult = { nisn: string; nama: string; email: string | null; success: boolean; error: string | null };

function ImportSiswaModal({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loadingSiswa, setLoadingSiswa] = useState(true);
  const [kelasFilter, setKelasFilter] = useState("semua");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("siswa")
      .select("*")
      .order("nama", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setSiswaList((data ?? []) as Siswa[]);
        setLoadingSiswa(false);
      });
  }, []);

  const kelasOptions = [...new Set(siswaList.map((s) => s.kelas))].sort(compareRombel);
  const filtered = kelasFilter === "semua" ? siswaList : siswaList.filter((s) => s.kelas === kelasFilter);
  const selectableIds = filtered.filter((s) => s.nisn).map((s) => s.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function handleImport() {
    const chosen = siswaList.filter((s) => selected.has(s.id));
    if (chosen.length === 0) return;
    setImporting(true);
    setError(null);

    const res = await fetch("/api/admin/users/import-siswa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siswa: chosen.map((s) => ({ nisn: s.nisn, nama: s.nama, kelas: s.kelas })) }),
    });
    const json = await res.json();
    setImporting(false);

    if (!res.ok) {
      setError(json.error ?? "Gagal membuat akun");
      return;
    }
    setResults(json.results);
    onDone();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-4xl w-full shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-1.5 shrink-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Import Akun dari Data Siswa</h3>
          <button onClick={onCancel}>
            <X className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        {results ? (
          <div className="overflow-y-auto">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {results.filter((r) => r.success).length} akun berhasil dibuat, {results.filter((r) => !r.success).length}{" "}
              gagal. Password awal setiap akun sama dengan NISN masing-masing siswa.
            </p>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {results.map((r, i) => (
                <div key={i} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{r.nama || r.nisn}</p>
                    {r.email && <p className="text-xs text-slate-400 truncate">{r.email}</p>}
                  </div>
                  <span
                    className={`text-xs shrink-0 ${
                      r.success ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {r.success ? "Berhasil" : r.error}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={onCancel}
              className="w-full mt-4 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700"
            >
              Tutup
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 shrink-0">
              Pilih siswa dari roster (menu Data Siswa) untuk dibuatkan akun login. Email dibentuk otomatis dari
              NISN, password awal juga sama dengan NISN.
            </p>

            <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
              <select
                value={kelasFilter}
                onChange={(e) => setKelasFilter(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="semua">Semua Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <span className="text-sm text-slate-500 dark:text-slate-400">{selected.size} dipilih</span>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-3 shrink-0">
                {error}
              </p>
            )}

            <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700/90">
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                    <th className="px-3 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        disabled={selectableIds.length === 0}
                        className="accent-indigo-600"
                      />
                    </th>
                    <th className="px-3 py-2 font-medium">No</th>
                    <th className="px-3 py-2 font-medium">NISN</th>
                    <th className="px-3 py-2 font-medium">Nama</th>
                    <th className="px-3 py-2 font-medium">Kelas</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Password</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSiswa ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-400 dark:text-slate-500">
                        Tidak ada data siswa.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s, idx) => (
                      <tr
                        key={s.id}
                        className="border-b border-slate-100 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700"
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(s.id)}
                            disabled={!s.nisn}
                            onChange={() => toggleOne(s.id)}
                            className="accent-indigo-600"
                          />
                        </td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                          {s.nisn || <span className="text-amber-600 dark:text-amber-400">kosong</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{s.nama}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s.kelas}</td>
                        <td className="px-3 py-2 text-slate-400 dark:text-slate-500 text-xs">
                          {s.nisn ? buildSiswaEmail(s.nisn) : "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-400 dark:text-slate-500 text-xs font-mono">
                          {s.nisn || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-4 shrink-0">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Buat Akun untuk {selected.size} Siswa
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [showImportSiswa, setShowImportSiswa] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal memuat daftar user");
        return;
      }
      setUsers(json.users);
    } catch {
      setError("Gagal memuat daftar user");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  async function handleRoleChange(user: ManagedUser, role: "admin" | "siswa") {
    setBusyId(user.id);
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setError(json.error ?? "Gagal mengubah role");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
  }

  function openResetPassword(user: ManagedUser) {
    setResetTarget(user);
    setNewPassword(generatePassword());
    setResetError(null);
    setResetDone(false);
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    if (newPassword.length < 6) {
      setResetError("Password minimal 6 karakter.");
      return;
    }
    setResetSaving(true);
    setResetError(null);
    const res = await fetch(`/api/admin/users/${resetTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    const json = await res.json();
    setResetSaving(false);
    if (!res.ok) {
      setResetError(json.error ?? "Gagal mereset password");
      return;
    }
    setResetDone(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
    const json = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setError(json.error ?? "Gagal menghapus user");
      setDeleteTarget(null);
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (u.email ?? "").toLowerCase().includes(q) || u.nama.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Kelola User</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Atur role akun (admin/siswa), reset password, dan hapus akun yang sudah tidak dipakai
          </p>
        </div>
        <button
          onClick={() => setShowImportSiswa(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-700 transition-colors shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Import dari Data Siswa
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Terakhir Login</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                    {users.length === 0 ? "Belum ada user." : "Tidak ada user yang cocok."}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {u.nama || "-"} {isSelf && <span className="text-xs text-slate-400">(Anda)</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={isSelf || busyId === u.id}
                          onChange={(e) => handleRoleChange(u, e.target.value as "admin" | "siswa")}
                          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs disabled:opacity-60"
                        >
                          <option value="siswa">Siswa</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("id-ID") : "Belum pernah login"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openResetPassword(u)}
                            disabled={busyId === u.id}
                            title="Reset Password"
                            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            disabled={isSelf || busyId === u.id}
                            title="Hapus"
                            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40"
                          >
                            {busyId === u.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showImportSiswa && (
        <ImportSiswaModal
          onCancel={() => setShowImportSiswa(false)}
          onDone={() => fetchUsers()}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Hapus user ini?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Akun <span className="font-medium text-slate-700 dark:text-slate-200">{deleteTarget.email}</span> akan
              dihapus permanen dan tidak bisa login lagi.
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

      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Reset Password</h3>
              <button onClick={() => setResetTarget(null)}>
                <X className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            {resetDone ? (
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-2 mb-3">
                  Password akun <strong>{resetTarget.email}</strong> berhasil diganti. Catat/salin password baru ini
                  dan sampaikan ke siswa yang bersangkutan -- tidak akan ditampilkan lagi.
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 mb-4">
                  <code className="flex-1 text-sm font-mono text-slate-800 dark:text-slate-100">{newPassword}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(newPassword)}
                    title="Salin"
                    className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => setResetTarget(null)}
                  className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Untuk akun <span className="font-medium text-slate-700 dark:text-slate-200">{resetTarget.email}</span>
                </p>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                  Password Baru
                </label>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPassword(generatePassword())}
                    title="Buat password acak"
                    className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {resetError && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
                    {resetError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setResetTarget(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetSaving}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {resetSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Simpan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
