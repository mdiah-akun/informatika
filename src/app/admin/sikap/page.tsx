import { createClient } from "@/lib/supabase/server";
import AdminSikapClient from "@/components/AdminSikapClient";
import type { Sikap } from "@/types/sikap";

export default async function AdminSikapPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sikap")
    .select("*")
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true });

  return <AdminSikapClient sikapAwal={(data ?? []) as Sikap[]} />;
}
