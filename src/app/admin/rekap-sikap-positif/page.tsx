import { createClient } from "@/lib/supabase/server";
import AdminRekapSikapClient from "@/components/AdminRekapSikapClient";
import type { Siswa } from "@/types/siswa";

export default async function AdminRekapSikapPositifPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("siswa")
    .select("id, nisn, nama, kelas")
    .order("nama", { ascending: true });

  return <AdminRekapSikapClient jenis="positif" siswaList={(data ?? []) as Pick<Siswa, "id" | "nisn" | "nama" | "kelas">[]} />;
}
