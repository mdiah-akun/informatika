import { createClient } from "@/lib/supabase/server";
import AdminJadwalClient from "@/components/AdminJadwalClient";
import type { JadwalPelajaran } from "@/types/jadwal";

export default async function AdminJadwalPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("jadwal_pelajaran").select("*").maybeSingle();

  return (
    <div className="max-w-3xl mx-auto">
      <AdminJadwalClient jadwalAwal={data as JadwalPelajaran | null} />
    </div>
  );
}
