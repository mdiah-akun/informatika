import { createClient } from "@/lib/supabase/server";
import { hitungNilaiAuto } from "@/lib/nilai-sumatif";
import AdminNilaiStsClient from "@/components/AdminNilaiStsClient";
import type { Siswa } from "@/types/siswa";

export default async function AdminNilaiSasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("siswa")
    .select("id, nisn, nama, kelas")
    .order("nama", { ascending: true });

  const siswa = (data ?? []) as Pick<Siswa, "id" | "nisn" | "nama" | "kelas">[];
  const nilaiAuto = await hitungNilaiAuto("sas", siswa);

  return <AdminNilaiStsClient jenis="sas" siswaList={siswa} nilaiAuto={nilaiAuto} />;
}
