import { createClient } from "@/lib/supabase/server";
import JadwalClient from "@/components/JadwalClient";
import type { JadwalPelajaran } from "@/types/jadwal";

export default async function JadwalPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("jadwal_pelajaran").select("*").maybeSingle();

  return <JadwalClient jadwal={data as JadwalPelajaran | null} />;
}
