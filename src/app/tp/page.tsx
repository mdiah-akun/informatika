import { createClient } from "@/lib/supabase/server";
import { kelasFromRombel } from "@/lib/rombel";
import TpClient from "@/components/TpClient";
import type { Bab } from "@/types/materi";
import type { TP } from "@/types/tp";

export default async function TpPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: babList }, { data: tpList }, { data: profile }] = await Promise.all([
    supabase.from("bab").select("*").order("urutan", { ascending: true }),
    supabase.from("tp").select("*").order("urutan", { ascending: true }),
    user
      ? supabase.from("profiles").select("role, kelas").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const initialKelas = kelasFromRombel(profile?.kelas) ?? undefined;
  const lockKelas = profile?.role === "siswa" && initialKelas !== undefined;

  return (
    <TpClient
      babList={(babList ?? []) as Bab[]}
      tpList={(tpList ?? []) as TP[]}
      initialKelas={initialKelas}
      lockKelas={lockKelas}
    />
  );
}
