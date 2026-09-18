import { createClient } from "@/lib/supabase/server";
import AdminSoalClient from "@/components/AdminSoalClient";
import type { Soal, SoalPengaturan } from "@/types/soal";
import type { SoalEssai, SoalEssaiPengaturan } from "@/types/soal-essai";

export default async function AdminSoalPage() {
  const supabase = await createClient();

  const [{ data: soalList }, { data: soalEssaiList }, { data: pengaturanList }, { data: pengaturanEssaiList }] =
    await Promise.all([
      supabase.from("soal").select("*").order("urutan", { ascending: true }),
      supabase.from("soal_essai").select("*").order("urutan", { ascending: true }),
      supabase.from("soal_pengaturan").select("*"),
      supabase.from("soal_essai_pengaturan").select("*"),
    ]);

  return (
    <AdminSoalClient
      soalAwal={(soalList ?? []) as Soal[]}
      soalEssaiAwal={(soalEssaiList ?? []) as SoalEssai[]}
      pengaturanAwal={(pengaturanList ?? []) as SoalPengaturan[]}
      pengaturanEssaiAwal={(pengaturanEssaiList ?? []) as SoalEssaiPengaturan[]}
    />
  );
}
