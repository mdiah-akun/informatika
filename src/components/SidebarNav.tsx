"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, BookOpen, Library, Users, IdCard, CalendarDays, BookText, Home, ListChecks, ClipboardList, Target, Link2 } from "lucide-react";

export default function SidebarNav({
  role,
  collapsed = false,
}: {
  role: "admin" | "siswa";
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const isActiveHome = pathname === "/";
  const isActiveMateri = pathname.startsWith("/materi");
  const isActiveAdminMateri = pathname.startsWith("/admin/materi") && !pathname.startsWith("/admin/materi-guru");
  const isActiveAdminUsers = pathname.startsWith("/admin/users");
  const isActiveAdminSiswa = pathname.startsWith("/admin/siswa");
  const isActiveAdminJadwal = pathname.startsWith("/admin/jadwal");
  const isActiveJadwal = pathname.startsWith("/jadwal");
  const isActiveAdminEbook = pathname.startsWith("/admin/ebook");
  const isActiveAdminMateriGuru = pathname.startsWith("/admin/materi-guru");
  const isActiveEbook = pathname.startsWith("/ebook");
  const isActiveAdminSoal = pathname.startsWith("/admin/soal");
  const isActiveAdminLaporan = pathname.startsWith("/admin/laporan");
  const isActiveAdminTp = pathname.startsWith("/admin/tp");
  const isActiveSoal = pathname.startsWith("/soal");
  const isActiveTp = pathname.startsWith("/tp");

  const linkClass = (active: boolean) =>
    `flex items-center rounded-lg text-sm font-medium transition-colors ${
      collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2"
    } ${
      active
        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
    }`;

  return (
    <aside
      className={`shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div
        className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-700 shrink-0 ${
          collapsed ? "justify-center px-0" : "gap-2.5 px-5"
        }`}
      >
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <GraduationCap className="h-4.5 w-4.5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
            Informatika SMP
          </span>
        )}
      </div>

      <nav className={`flex-1 py-4 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {role === "admin" ? (
          <>
            <Link href="/" title="Home" className={linkClass(isActiveHome)}>
              <Home className="h-4 w-4 shrink-0" />
              {!collapsed && "Home"}
            </Link>
            <Link href="/admin/materi" title="Kelola Materi" className={linkClass(isActiveAdminMateri)}>
              <Library className="h-4 w-4 shrink-0" />
              {!collapsed && "Kelola Materi"}
            </Link>
            <Link href="/admin/tp" title="Tujuan Pembelajaran" className={linkClass(isActiveAdminTp)}>
              <Target className="h-4 w-4 shrink-0" />
              {!collapsed && "TP"}
            </Link>
            <Link href="/admin/siswa" title="Data Siswa" className={linkClass(isActiveAdminSiswa)}>
              <IdCard className="h-4 w-4 shrink-0" />
              {!collapsed && "Data Siswa"}
            </Link>
            <Link href="/admin/users" title="Kelola User" className={linkClass(isActiveAdminUsers)}>
              <Users className="h-4 w-4 shrink-0" />
              {!collapsed && "Kelola User"}
            </Link>
            <Link href="/admin/jadwal" title="Jadwal Pelajaran" className={linkClass(isActiveAdminJadwal)}>
              <CalendarDays className="h-4 w-4 shrink-0" />
              {!collapsed && "Jadwal Pelajaran"}
            </Link>
            <Link href="/admin/ebook" title="E-book" className={linkClass(isActiveAdminEbook)}>
              <BookText className="h-4 w-4 shrink-0" />
              {!collapsed && "E-book"}
            </Link>
            <Link href="/admin/materi-guru" title="Materi Guru" className={linkClass(isActiveAdminMateriGuru)}>
              <Link2 className="h-4 w-4 shrink-0" />
              {!collapsed && "Materi Guru"}
            </Link>
            <Link href="/admin/soal" title="Bank Soal" className={linkClass(isActiveAdminSoal)}>
              <ListChecks className="h-4 w-4 shrink-0" />
              {!collapsed && "Bank Soal"}
            </Link>
            <Link href="/admin/laporan" title="Laporan Ujian" className={linkClass(isActiveAdminLaporan)}>
              <ClipboardList className="h-4 w-4 shrink-0" />
              {!collapsed && "Laporan Ujian"}
            </Link>
          </>
        ) : (
          <>
            <Link href="/" title="Home" className={linkClass(isActiveHome)}>
              <Home className="h-4 w-4 shrink-0" />
              {!collapsed && "Home"}
            </Link>
            <Link href="/materi" title="Daftar Materi" className={linkClass(isActiveMateri)}>
              <BookOpen className="h-4 w-4 shrink-0" />
              {!collapsed && "Daftar Materi"}
            </Link>
            <Link href="/tp" title="Tujuan Pembelajaran" className={linkClass(isActiveTp)}>
              <Target className="h-4 w-4 shrink-0" />
              {!collapsed && "TP"}
            </Link>
            <Link href="/jadwal" title="Jadwal Pelajaran" className={linkClass(isActiveJadwal)}>
              <CalendarDays className="h-4 w-4 shrink-0" />
              {!collapsed && "Jadwal Pelajaran"}
            </Link>
            <Link href="/ebook" title="E-book" className={linkClass(isActiveEbook)}>
              <BookText className="h-4 w-4 shrink-0" />
              {!collapsed && "E-book"}
            </Link>
            <Link href="/soal" title="Soal" className={linkClass(isActiveSoal)}>
              <ListChecks className="h-4 w-4 shrink-0" />
              {!collapsed && "Soal"}
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
