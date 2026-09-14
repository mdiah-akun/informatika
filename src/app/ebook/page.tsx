import { createClient } from "@/lib/supabase/server";
import { kelasFromRombel } from "@/lib/rombel";
import EbookClient from "@/components/EbookClient";
import type { Ebook } from "@/types/ebook";

export default async function EbookPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: ebookList }, { data: profile }] = await Promise.all([
    supabase.from("ebook").select("*").eq("jenis", "siswa").order("urutan", { ascending: true }),
    user
      ? supabase.from("profiles").select("role, kelas").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const initialKelas = kelasFromRombel(profile?.kelas) ?? undefined;
  const lockKelas = profile?.role === "siswa" && initialKelas !== undefined;

  return (
    <EbookClient
      ebookList={(ebookList ?? []) as Ebook[]}
      initialKelas={initialKelas}
      lockKelas={lockKelas}
    />
  );
}
