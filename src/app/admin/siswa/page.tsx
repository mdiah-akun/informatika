import { createClient } from "@/lib/supabase/server";
import AdminSiswaClient from "@/components/AdminSiswaClient";
import type { Siswa } from "@/types/siswa";

export default async function AdminSiswaPage() {
  const supabase = await createClient();

  const { data: siswaList } = await supabase
    .from("siswa")
    .select("*")
    .order("nama", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto">
      <AdminSiswaClient siswaAwal={(siswaList ?? []) as Siswa[]} />
    </div>
  );
}
