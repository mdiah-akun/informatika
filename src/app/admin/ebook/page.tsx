import { createClient } from "@/lib/supabase/server";
import AdminEbookClient from "@/components/AdminEbookClient";
import type { Ebook } from "@/types/ebook";

export default async function AdminEbookPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("ebook").select("*").order("urutan", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto">
      <AdminEbookClient ebookAwal={(data ?? []) as Ebook[]} />
    </div>
  );
}
