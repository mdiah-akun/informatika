import { createClient } from "@/lib/supabase/server";
import { kelasFromRombel } from "@/lib/rombel";
import KisiKisiClient from "@/components/KisiKisiClient";
import type { KisiKisi } from "@/types/kisi-kisi";

export default async function KisiKisiPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: kisiList }, { data: profile }] = await Promise.all([
    supabase.from("kisi_kisi").select("*").order("urutan", { ascending: true }),
    user
      ? supabase.from("profiles").select("role, kelas").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const initialKelas = kelasFromRombel(profile?.kelas) ?? undefined;
  const lockKelas = profile?.role === "siswa" && initialKelas !== undefined;

  return <KisiKisiClient kisiList={(kisiList ?? []) as KisiKisi[]} initialKelas={initialKelas} lockKelas={lockKelas} />;
}
