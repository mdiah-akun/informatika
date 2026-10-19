import { createClient } from "@/lib/supabase/server";
import AdminImportSikapClient from "@/components/AdminImportSikapClient";
import type { Sikap } from "@/types/sikap";
import type { Siswa } from "@/types/siswa";

export default async function AdminImportSikapPage() {
  const supabase = await createClient();

  const [{ data: siswa }, { data: sikap }] = await Promise.all([
    supabase.from("siswa").select("id, nisn, nama, kelas").range(0, 4999),
    supabase.from("sikap").select("*"),
  ]);

  return (
    <AdminImportSikapClient
      siswaList={(siswa ?? []) as Pick<Siswa, "id" | "nisn" | "nama" | "kelas">[]}
      sikapList={(sikap ?? []) as Sikap[]}
    />
  );
}
