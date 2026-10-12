import { createClient } from "@/lib/supabase/server";
import { hitungNilaiAuto } from "@/lib/nilai-sumatif";
import AdminNilaiStsClient from "@/components/AdminNilaiStsClient";
import type { Siswa } from "@/types/siswa";

export default async function AdminNilaiStsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("siswa")
    .select("id, nisn, nama, kelas")
    .order("nama", { ascending: true });

  const siswa = (data ?? []) as Pick<Siswa, "id" | "nisn" | "nama" | "kelas">[];
  const nilaiAuto = await hitungNilaiAuto("sts", siswa);

  return <AdminNilaiStsClient jenis="sts" siswaList={siswa} nilaiAuto={nilaiAuto} />;
}
