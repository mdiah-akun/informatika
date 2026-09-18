import { createClient } from "@/lib/supabase/server";
import AdminMateriGuruClient from "@/components/AdminMateriGuruClient";
import type { MateriGuru } from "@/types/materi-guru";

export default async function AdminMateriGuruPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("materi_guru").select("*").order("urutan", { ascending: true });

  return <AdminMateriGuruClient materiGuruAwal={(data ?? []) as MateriGuru[]} />;
}
