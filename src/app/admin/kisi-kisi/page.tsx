import { createClient } from "@/lib/supabase/server";
import AdminKisiKisiClient from "@/components/AdminKisiKisiClient";
import type { KisiKisi } from "@/types/kisi-kisi";

export default async function AdminKisiKisiPage() {
  const supabase = await createClient();

  const { data } = await supabase.from("kisi_kisi").select("*").order("urutan", { ascending: true });

  return <AdminKisiKisiClient kisiAwal={(data ?? []) as KisiKisi[]} />;
}
