import { createClient } from "@/lib/supabase/server";
import AdminLaporanClient from "@/components/AdminLaporanClient";
import type { SoalAttempt } from "@/types/soal";
import type { SoalEssai, SoalEssaiAttempt } from "@/types/soal-essai";
import type { LaporanRow, LaporanEssaiRow } from "@/components/AdminLaporanClient";

export default async function AdminLaporanPage() {
  const supabase = await createClient();

  const [{ data: attemptRows }, { data: attemptEssaiRows }, { data: soalEssaiRows }, { data: profileRows }] =
    await Promise.all([
      supabase.from("soal_attempt").select("*").order("mulai_at", { ascending: false }),
      supabase.from("soal_essai_attempt").select("*").order("mulai_at", { ascending: false }),
      supabase.from("soal_essai").select("*"),
      supabase.from("profiles").select("id, nama, kelas"),
    ]);

  const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p]));

  const laporan: LaporanRow[] = ((attemptRows ?? []) as SoalAttempt[]).map((a) => ({
    ...a,
    nama: profileMap.get(a.siswa_id)?.nama ?? "(akun tidak ditemukan)",
    rombel: profileMap.get(a.siswa_id)?.kelas ?? null,
  }));

  const laporanEssai: LaporanEssaiRow[] = ((attemptEssaiRows ?? []) as SoalEssaiAttempt[]).map((a) => ({
    ...a,
    nama: profileMap.get(a.siswa_id)?.nama ?? "(akun tidak ditemukan)",
    rombel: profileMap.get(a.siswa_id)?.kelas ?? null,
  }));

  return (
    <AdminLaporanClient
      laporanAwal={laporan}
      laporanEssaiAwal={laporanEssai}
      soalEssaiList={(soalEssaiRows ?? []) as SoalEssai[]}
    />
  );
}
