import { createClient } from "@/lib/supabase/server";
import AdminCatatSikapClient from "@/components/AdminCatatSikapClient";
import type { Sikap } from "@/types/sikap";
import type { Siswa } from "@/types/siswa";

export default async function AdminCatatSikapNegatifPage() {
  const supabase = await createClient();

  const [{ data: siswa }, { data: sikap }] = await Promise.all([
    supabase.from("siswa").select("id, nisn, nama, kelas").order("nama", { ascending: true }),
    supabase
      .from("sikap")
      .select("*")
      .eq("jenis", "negatif")
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  return (
    <AdminCatatSikapClient
      jenis="negatif"
      siswaList={(siswa ?? []) as Pick<Siswa, "id" | "nisn" | "nama" | "kelas">[]}
      sikapList={(sikap ?? []) as Sikap[]}
    />
  );
}
