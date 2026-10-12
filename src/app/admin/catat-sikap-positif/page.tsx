import { createClient } from "@/lib/supabase/server";
import AdminCatatSikapClient from "@/components/AdminCatatSikapClient";
import type { Sikap } from "@/types/sikap";
import type { Siswa } from "@/types/siswa";

export default async function AdminCatatSikapPositifPage() {
  const supabase = await createClient();

  const [{ data: siswa }, { data: sikap }] = await Promise.all([
    supabase.from("siswa").select("id, nisn, nama, kelas").order("nama", { ascending: true }),
    supabase
      .from("sikap")
      .select("*")
      .eq("jenis", "positif")
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  return (
    <AdminCatatSikapClient
      jenis="positif"
      siswaList={(siswa ?? []) as Pick<Siswa, "id" | "nisn" | "nama" | "kelas">[]}
      sikapList={(sikap ?? []) as Sikap[]}
    />
  );
}
