import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kelasFromRombel } from "@/lib/rombel";
import type { SoalJenis, SoalPengaturan, SoalAttempt } from "@/types/soal";
import type { SoalEssaiPengaturan, SoalEssaiAttempt } from "@/types/soal-essai";
import { ListChecks, FileText, Clock, CheckCircle2, Lock } from "lucide-react";

const JENIS_LIST: { value: SoalJenis; label: string }[] = [
  { value: "harian", label: "Soal Harian" },
  { value: "sts", label: "STS" },
  { value: "sas", label: "SAS" },
];

export default async function SoalListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("kelas").eq("id", user.id).maybeSingle();
  const kelas = kelasFromRombel(profile?.kelas);

  if (!kelas) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Soal</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kelas kamu belum diatur. Hubungi admin/guru untuk mengaktifkan akses soal.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();
  const [
    { data: soalRows },
    { data: soalEssaiRows },
    { data: pengaturanRows },
    { data: pengaturanEssaiRows },
    { data: attemptRows },
    { data: attemptEssaiRows },
  ] = await Promise.all([
    admin.from("soal").select("id, jenis").eq("kelas", kelas),
    admin.from("soal_essai").select("id, jenis").eq("kelas", kelas),
    admin.from("soal_pengaturan").select("*").eq("kelas", kelas),
    admin.from("soal_essai_pengaturan").select("*").eq("kelas", kelas),
    admin.from("soal_attempt").select("*").eq("siswa_id", user.id).eq("kelas", kelas),
    admin.from("soal_essai_attempt").select("*").eq("siswa_id", user.id).eq("kelas", kelas),
  ]);

  const now = new Date();

  function StatusPG({ jenis }: { jenis: SoalJenis }) {
    const jumlahSoal = (soalRows ?? []).filter((s) => s.jenis === jenis).length;
    const pengaturan = (pengaturanRows ?? []).find((p) => p.jenis === jenis) as SoalPengaturan | undefined;
    const attempt = (attemptRows ?? []).find((a) => a.jenis === jenis) as SoalAttempt | undefined;

    if (jumlahSoal === 0) {
      return (
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" /> Belum ada soal
        </p>
      );
    }
    if (attempt?.status === "selesai") {
      return (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Selesai &middot; Nilai {attempt.skor}
        </p>
      );
    }
    if (pengaturan?.mulai_at && now < new Date(pengaturan.mulai_at)) {
      return (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Mulai {new Date(pengaturan.mulai_at).toLocaleString("id-ID")}
        </p>
      );
    }
    if (pengaturan?.selesai_at && now > new Date(pengaturan.selesai_at)) {
      return (
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" /> Waktu pengerjaan sudah berakhir
        </p>
      );
    }
    return (
      <Link
        href={`/soal/kerjakan/${jenis}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700"
      >
        {attempt?.status === "berjalan" ? "Lanjutkan" : "Mulai Kerjakan"}
      </Link>
    );
  }

  function StatusEssai({ jenis }: { jenis: SoalJenis }) {
    const jumlahSoal = (soalEssaiRows ?? []).filter((s) => s.jenis === jenis).length;
    const pengaturan = (pengaturanEssaiRows ?? []).find((p) => p.jenis === jenis) as SoalEssaiPengaturan | undefined;
    const attempt = (attemptEssaiRows ?? []).find((a) => a.jenis === jenis) as SoalEssaiAttempt | undefined;

    if (jumlahSoal === 0) {
      return (
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" /> Belum ada soal
        </p>
      );
    }
    if (attempt?.status === "selesai") {
      return (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Terkirim &middot; menunggu dinilai guru
        </p>
      );
    }
    if (pengaturan?.mulai_at && now < new Date(pengaturan.mulai_at)) {
      return (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Mulai {new Date(pengaturan.mulai_at).toLocaleString("id-ID")}
        </p>
      );
    }
    if (pengaturan?.selesai_at && now > new Date(pengaturan.selesai_at)) {
      return (
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" /> Waktu pengerjaan sudah berakhir
        </p>
      );
    }
    return (
      <Link
        href={`/soal/kerjakan-essai/${jenis}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700"
      >
        {attempt?.status === "berjalan" ? "Lanjutkan" : "Mulai Kerjakan"}
      </Link>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Soal</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Soal pilihan ganda dan essai untuk kelasmu</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {JENIS_LIST.map((j) => (
          <div
            key={j.value}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5"
          >
            <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-4">{j.label}</h3>

            <div className="flex items-start gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <ListChecks className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Pilihan Ganda</p>
                <StatusPG jenis={j.value} />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                <FileText className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Essai</p>
                <StatusEssai jenis={j.value} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
