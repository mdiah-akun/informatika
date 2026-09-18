import { createClient } from "@/lib/supabase/server";
import AdminTpClient from "@/components/AdminTpClient";
import type { Bab } from "@/types/materi";
import type { TP } from "@/types/tp";

export default async function AdminTpPage() {
  const supabase = await createClient();

  const [{ data: babList }, { data: tpList }] = await Promise.all([
    supabase.from("bab").select("*").order("urutan", { ascending: true }),
    supabase.from("tp").select("*").order("urutan", { ascending: true }),
  ]);

  return <AdminTpClient babList={(babList ?? []) as Bab[]} tpAwal={(tpList ?? []) as TP[]} />;
}
