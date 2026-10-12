import { createClient } from "@/lib/supabase/server";
import AdminPresensiClient from "@/components/AdminPresensiClient";
import type { Siswa } from "@/types/siswa";

export default async function AdminPresensiPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("siswa")
    .select("id, nama, kelas")
    .order("nama", { ascending: true });

  return <AdminPresensiClient siswaList={(data ?? []) as Pick<Siswa, "id" | "nama" | "kelas">[]} />;
}
