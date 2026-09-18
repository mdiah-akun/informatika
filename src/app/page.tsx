import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/DashboardShell";
import { kelasFromRombel } from "@/lib/rombel";
import { kelasLabel } from "@/lib/kelas";
import {
  Library,
  IdCard,
  Users,
  BookText,
  CalendarDays,
  BookOpen,
  GraduationCap,
  ListChecks,
  ClipboardList,
  Target,
  ArrowRight,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 leading-tight">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm transition-all"
    >
      <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
    </Link>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, role, kelas")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role === "admin" ? "admin" : "siswa";
  const nama = profile?.nama || user.email || "";

  return (
    <DashboardShell role={role} nama={nama}>
      <div className="px-4 md:px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Selamat datang, {nama}!</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
          {role === "admin"
            ? "Ringkasan konten dan data di Informatika SMP."
            : "Ringkasan materi dan info kelas kamu."}
        </p>

        {role === "admin" ? <AdminHome supabase={supabase} /> : <SiswaHome supabase={supabase} kelasRombel={profile?.kelas ?? null} />}
      </div>
    </DashboardShell>
  );
}

async function AdminHome({ supabase }: { supabase: Awaited<ReturnType<typeof createClient>> }) {
  const [
    { count: siswaCount },
    { count: babCount },
    { count: materiPublishedCount },
    { count: ebookCount },
    { count: siswaAkunCount },
  ] = await Promise.all([
    supabase.from("siswa").select("*", { count: "exact", head: true }),
    supabase.from("bab").select("*", { count: "exact", head: true }),
    supabase.from("materi").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("ebook").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "siswa"),
  ]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={IdCard} label="Data Siswa" value={siswaCount ?? 0} />
        <StatCard icon={Library} label="Bab Materi" value={babCount ?? 0} />
        <StatCard icon={BookOpen} label="Materi Terbit" value={materiPublishedCount ?? 0} />
        <StatCard icon={BookText} label="E-book" value={ebookCount ?? 0} />
      </div>

      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Menu Cepat</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <QuickLink href="/admin/materi" icon={Library} title="Kelola Materi" description="Susun bab dan materi per kelas" />
        <QuickLink href="/admin/tp" icon={Target} title="TP" description="Catat tujuan pembelajaran per bab" />
        <QuickLink href="/admin/siswa" icon={IdCard} title="Data Siswa" description={`${siswaCount ?? 0} siswa terdaftar`} />
        <QuickLink
          href="/admin/users"
          icon={Users}
          title="Kelola User"
          description={`${siswaAkunCount ?? 0} akun siswa aktif`}
        />
        <QuickLink href="/admin/jadwal" icon={CalendarDays} title="Jadwal Pelajaran" description="Atur gambar jadwal pelajaran" />
        <QuickLink href="/admin/ebook" icon={BookText} title="E-book" description="Pegangan guru & siswa" />
        <QuickLink href="/admin/soal" icon={ListChecks} title="Bank Soal" description="Soal harian, STS, dan SAS" />
        <QuickLink href="/admin/laporan" icon={ClipboardList} title="Laporan Ujian" description="Nilai dan status pengerjaan siswa" />
      </div>
    </>
  );
}

async function SiswaHome({
  supabase,
  kelasRombel,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  kelasRombel: string | null;
}) {
  const kelasNum = kelasFromRombel(kelasRombel);

  let materiTersedia = 0;
  let ebookTersedia = 0;

  if (kelasNum) {
    const { data: babRows } = await supabase.from("bab").select("id").eq("kelas", kelasNum);
    const babIds = (babRows ?? []).map((b) => b.id);

    if (babIds.length > 0) {
      const { count } = await supabase
        .from("materi")
        .select("*", { count: "exact", head: true })
        .eq("published", true)
        .in("bab_id", babIds);
      materiTersedia = count ?? 0;
    }

    const { count: ebookCount } = await supabase
      .from("ebook")
      .select("*", { count: "exact", head: true })
      .eq("jenis", "siswa")
      .eq("kelas", kelasNum);
    ebookTersedia = ebookCount ?? 0;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={GraduationCap} label="Kelas" value={kelasRombel || "Belum diatur"} />
        <StatCard icon={BookOpen} label="Materi Tersedia" value={materiTersedia} />
        <StatCard icon={BookText} label="E-book Tersedia" value={ebookTersedia} />
      </div>

      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Menu Cepat</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <QuickLink href="/materi" icon={BookOpen} title="Daftar Materi" description={`${materiTersedia} materi ${kelasNum ? kelasLabel(kelasNum) : ""}`} />
        <QuickLink href="/tp" icon={Target} title="Tujuan Pembelajaran" description="Lihat TP per bab" />
        <QuickLink href="/jadwal" icon={CalendarDays} title="Jadwal Pelajaran" description="Lihat jadwal pelajaran" />
        <QuickLink href="/ebook" icon={BookText} title="E-book" description={`${ebookTersedia} buku pegangan siswa`} />
      </div>
    </>
  );
}
