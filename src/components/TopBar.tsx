"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlignJustify, ArrowLeft, ChevronDown, LogOut, KeyRound, X, Check, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { usePageBack } from "@/lib/page-header-context";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function TopBar({
  nama,
  role,
  collapsed,
  onToggleSidebar,
}: {
  nama: string;
  role: "admin" | "siswa";
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const back = usePageBack();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSaving, setChangeSaving] = useState(false);
  const [changeDone, setChangeDone] = useState(false);

  const displayName = nama || "User";
  const initials = getInitials(displayName);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function openChangePassword() {
    setMenuOpen(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangeError(null);
    setChangeDone(false);
    setShowChangePassword(true);
  }

  async function handleChangePassword() {
    if (!oldPassword) {
      setChangeError("Password lama wajib diisi.");
      return;
    }
    if (newPassword.length < 6) {
      setChangeError("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setChangeSaving(true);
    setChangeError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setChangeSaving(false);
      setChangeError("Gagal membaca akun saat ini.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });
    if (signInError) {
      setChangeSaving(false);
      setChangeError("Password lama salah.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setChangeSaving(false);
    if (updateError) {
      setChangeError(updateError.message);
      return;
    }
    setChangeDone(true);
  }

  return (
    <>
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 sm:px-6 relative">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggleSidebar}
          title={collapsed ? "Tampilkan menu" : "Sembunyikan menu"}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
        >
          <AlignJustify className="h-5 w-5" />
        </button>
        {back && (
          <Link
            href={back.href}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{back.label}</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg pl-2 pr-3 py-1.5 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{displayName}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight capitalize">{role}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1.5 z-50">
                <button
                  onClick={openChangePassword}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <KeyRound className="h-4 w-4" />
                  Ubah Password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>

    {showChangePassword && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Ubah Password</h3>
            <button onClick={() => setShowChangePassword(false)}>
              <X className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </button>
          </div>

          {changeDone ? (
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-2 mb-4 mt-3">
                Password berhasil diubah.
              </p>
              <button
                onClick={() => setShowChangePassword(false)}
                className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700"
              >
                Tutup
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Masukkan password lama untuk konfirmasi, lalu password baru.
              </p>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                Password Lama
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                Password Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {changeError && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
                  {changeError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={changeSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
                >
                  {changeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Simpan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
