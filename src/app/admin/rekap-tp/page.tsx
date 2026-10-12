import { createClient } from "@/lib/supabase/server";
import AdminRekapTpClient from "@/components/AdminRekapTpClient";
import type { Bab } from "@/types/materi";
import type { Siswa } from "@/types/siswa";
import type { TP } from "@/types/tp";

export default async function AdminRekapTpPage() {
  const supabase = await createClient();

  const [{ data: siswa }, { data: bab }, { data: tp }] = await Promise.all([
    supabase.from("siswa").select("id, nisn, nama, kelas").order("nama", { ascending: true }),
    supabase.from("bab").select("*").order("urutan", { ascending: true }),
    supabase.from("tp").select("*").order("urutan", { ascending: true }),
  ]);

  return (
    <AdminRekapTpClient
      siswaList={(siswa ?? []) as Pick<Siswa, "id" | "nisn" | "nama" | "kelas">[]}
      babList={(bab ?? []) as Bab[]}
      tpList={(tp ?? []) as TP[]}
    />
  );
}
