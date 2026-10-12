"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, BookOpen, Library, Users, IdCard, CalendarDays, BookText, Home, ListChecks, ClipboardList, Target, Link2, NotebookPen, ClipboardCheck, BarChart3, Smile, ThumbsUp, ThumbsDown, Award, AlertTriangle, SquarePen, Table, FileCheck2, FileCheck, School } from "lucide-react";

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
  const isActiveAdminJurnal = pathname.startsWith("/admin/jurnal");
  const isActiveAdminPresensi = pathname.startsWith("/admin/presensi");
  const isActiveAdminLapPresensi = pathname.startsWith("/admin/lap-presensi");
  const isActiveAdminCatatNilaiTp = pathname.startsWith("/admin/catat-nilai-tp");
  const isActiveAdminRekapTp = pathname.startsWith("/admin/rekap-tp");
  const isActiveAdminNilaiSts = pathname.startsWith("/admin/nilai-sts");
  const isActiveAdminNilaiSas = pathname.startsWith("/admin/nilai-sas");
  const isActiveAdminKelas = pathname.startsWith("/admin/kelas");
  const isActiveAdminSikap = pathname.startsWith("/admin/sikap");
  const isActiveAdminCatatSikapPositif = pathname.startsWith("/admin/catat-sikap-positif");
  const isActiveAdminCatatSikapNegatif = pathname.startsWith("/admin/catat-sikap-negatif");
  const isActiveAdminRekapSikapPositif = pathname.startsWith("/admin/rekap-sikap-positif");
  const isActiveAdminRekapSikapNegatif = pathname.startsWith("/admin/rekap-sikap-negatif");
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
      className={`shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col h-full min-h-0 transition-all duration-200 ${
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

      <nav className={`flex-1 min-h-0 overflow-y-auto scroll-samar py-4 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
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
            <Link href="/admin/kelas" title="Kelas" className={linkClass(isActiveAdminKelas)}>
              <School className="h-4 w-4 shrink-0" />
              {!collapsed && "Kelas"}
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
            <Link href="/admin/jurnal" title="Jurnal Mengajar" className={linkClass(isActiveAdminJurnal)}>
              <NotebookPen className="h-4 w-4 shrink-0" />
              {!collapsed && "Jurnal Mengajar"}
            </Link>
            <Link href="/admin/presensi" title="Presensi" className={linkClass(isActiveAdminPresensi)}>
              <ClipboardCheck className="h-4 w-4 shrink-0" />
              {!collapsed && "Presensi"}
            </Link>
            <Link href="/admin/lap-presensi" title="Lap. Presensi" className={linkClass(isActiveAdminLapPresensi)}>
              <BarChart3 className="h-4 w-4 shrink-0" />
              {!collapsed && "Lap. Presensi"}
            </Link>
            <Link href="/admin/catat-nilai-tp" title="Catat Nilai TP" className={linkClass(isActiveAdminCatatNilaiTp)}>
              <SquarePen className="h-4 w-4 shrink-0" />
              {!collapsed && "Catat Nilai TP"}
            </Link>
            <Link href="/admin/rekap-tp" title="Rekap TP" className={linkClass(isActiveAdminRekapTp)}>
              <Table className="h-4 w-4 shrink-0" />
              {!collapsed && "Rekap TP"}
            </Link>
            <Link href="/admin/nilai-sts" title="Nilai STS" className={linkClass(isActiveAdminNilaiSts)}>
              <FileCheck2 className="h-4 w-4 shrink-0" />
              {!collapsed && "Nilai STS"}
            </Link>
            <Link href="/admin/nilai-sas" title="Nilai SAS" className={linkClass(isActiveAdminNilaiSas)}>
              <FileCheck className="h-4 w-4 shrink-0" />
              {!collapsed && "Nilai SAS"}
            </Link>
            {collapsed ? (
              <div className="my-2 border-t border-slate-200 dark:border-slate-700" title="Nilai Sikap" />
            ) : (
              <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Nilai Sikap
              </p>
            )}
            <Link href="/admin/sikap" title="Sikap" className={linkClass(isActiveAdminSikap)}>
              <Smile className="h-4 w-4 shrink-0" />
              {!collapsed && "Sikap"}
            </Link>
            <Link
              href="/admin/catat-sikap-positif"
              title="Catat Sikap +"
              className={linkClass(isActiveAdminCatatSikapPositif)}
            >
              <ThumbsUp className="h-4 w-4 shrink-0" />
              {!collapsed && "Catat Sikap +"}
            </Link>
            <Link
              href="/admin/catat-sikap-negatif"
              title="Catat Sikap -"
              className={linkClass(isActiveAdminCatatSikapNegatif)}
            >
              <ThumbsDown className="h-4 w-4 shrink-0" />
              {!collapsed && "Catat Sikap -"}
            </Link>
            <Link
              href="/admin/rekap-sikap-positif"
              title="Rekap Sikap +"
              className={linkClass(isActiveAdminRekapSikapPositif)}
            >
              <Award className="h-4 w-4 shrink-0" />
              {!collapsed && "Rekap Sikap +"}
            </Link>
            <Link
              href="/admin/rekap-sikap-negatif"
              title="Rekap Sikap -"
              className={linkClass(isActiveAdminRekapSikapNegatif)}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {!collapsed && "Rekap Sikap -"}
            </Link>
            <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
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
