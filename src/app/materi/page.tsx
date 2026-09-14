import { createClient } from "@/lib/supabase/server";
import { kelasFromRombel } from "@/lib/rombel";
import MateriListClient from "@/components/materi/MateriListClient";
import type { Bab, Materi, MateriLampiran } from "@/types/materi";

export default async function MateriListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: babList }, { data: materiList }, { data: lampiranList }, { data: profile }] = await Promise.all([
    supabase.from("bab").select("*").order("urutan", { ascending: true }),
    supabase
      .from("materi")
      .select("*")
      .eq("published", true)
      .order("urutan", { ascending: true }),
    supabase.from("materi_lampiran").select("*").order("urutan", { ascending: true }),
    user
      ? supabase.from("profiles").select("role, kelas").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const initialKelas = kelasFromRombel(profile?.kelas) ?? undefined;
  // Siswa yang kelasnya sudah diketahui langsung dikunci ke kelasnya sendiri
  // (tab disembunyikan) -- admin, atau siswa yang belum ada data kelasnya,
  // tetap bisa pilih lewat tab.
  const lockKelas = profile?.role === "siswa" && initialKelas !== undefined;

  return (
    <MateriListClient
      babList={(babList ?? []) as Bab[]}
      materiList={(materiList ?? []) as Materi[]}
      lampiranList={(lampiranList ?? []) as MateriLampiran[]}
      initialKelas={initialKelas}
      lockKelas={lockKelas}
    />
  );
}
