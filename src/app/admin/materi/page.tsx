import { createClient } from "@/lib/supabase/server";
import AdminMateriClient from "@/components/materi/AdminMateriClient";
import type { Bab, Materi, MateriLampiran } from "@/types/materi";

export default async function AdminMateriPage() {
  const supabase = await createClient();

  const [{ data: babList }, { data: materiList }, { data: lampiranList }] = await Promise.all([
    supabase.from("bab").select("*").order("urutan", { ascending: true }),
    supabase.from("materi").select("*").order("urutan", { ascending: true }),
    supabase.from("materi_lampiran").select("*").order("urutan", { ascending: true }),
  ]);

  return (
    <AdminMateriClient
      babAwal={(babList ?? []) as Bab[]}
      materiAwal={(materiList ?? []) as Materi[]}
      lampiranAwal={(lampiranList ?? []) as MateriLampiran[]}
    />
  );
}
