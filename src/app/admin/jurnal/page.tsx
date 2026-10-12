import { createClient } from "@/lib/supabase/server";
import AdminJurnalClient from "@/components/AdminJurnalClient";
import type { JurnalMengajar } from "@/types/jurnal";

export default async function AdminJurnalPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jurnal_mengajar")
    .select("*")
    .order("pertemuan_ke", { ascending: true });

  const { data: siswaKelas } = await supabase.from("siswa").select("kelas").order("kelas", { ascending: true });
  const rombelList = Array.from(new Set((siswaKelas ?? []).map((s) => s.kelas as string).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, undefined, { numeric: true })
  );

  return <AdminJurnalClient jurnalAwal={(data ?? []) as JurnalMengajar[]} rombelList={rombelList} />;
}
