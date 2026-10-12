import { createClient } from "@/lib/supabase/server";
import AdminRekapSikapClient from "@/components/AdminRekapSikapClient";
import type { Siswa } from "@/types/siswa";

export default async function AdminRekapSikapNegatifPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("siswa")
    .select("id, nisn, nama, kelas")
    .order("nama", { ascending: true });

  return <AdminRekapSikapClient jenis="negatif" siswaList={(data ?? []) as Pick<Siswa, "id" | "nisn" | "nama" | "kelas">[]} />;
}
