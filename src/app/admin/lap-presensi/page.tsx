import { createClient } from "@/lib/supabase/server";
import AdminLapPresensiClient from "@/components/AdminLapPresensiClient";
import type { Siswa } from "@/types/siswa";

export default async function AdminLapPresensiPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("siswa")
    .select("id, nama, kelas")
    .order("nama", { ascending: true });

  return <AdminLapPresensiClient siswaList={(data ?? []) as Pick<Siswa, "id" | "nama" | "kelas">[]} />;
}
