import { createClient } from "@/lib/supabase/server";
import AdminKelasClient from "@/components/AdminKelasClient";
import type { KelasPengaturan } from "@/types/kelas-pengaturan";

export default async function AdminKelasPage() {
  const supabase = await createClient();

  const [{ data: siswa }, { data: pengaturan }] = await Promise.all([
    supabase.from("siswa").select("kelas"),
    supabase.from("kelas_pengaturan").select("*"),
  ]);

  const rombelList = Array.from(new Set((siswa ?? []).map((s) => s.kelas as string).filter(Boolean))).sort(
    (a, b) => {
      const urutan = (r: string) => (r.startsWith("VIII.") ? 2 : r.startsWith("VII.") ? 1 : r.startsWith("IX.") ? 3 : 4);
      return urutan(a) - urutan(b) || a.localeCompare(b, undefined, { numeric: true });
    }
  );

  return <AdminKelasClient rombelList={rombelList} pengaturanAwal={(pengaturan ?? []) as KelasPengaturan[]} />;
}
