"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlignJustify, ArrowLeft, ChevronDown, LogOut } from "lucide-react";
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

  const displayName = nama || "User";
  const initials = getInitials(displayName);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
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
              <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1.5 z-50">
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
  );
}
