import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MateriFileViewer from "@/components/materi/MateriFileViewer";
import { SetPageBack } from "@/lib/page-header-context";
import { materiFileViewUrl } from "@/lib/file-types";
import { ArrowLeft, Paperclip } from "lucide-react";
import type { Materi, MateriLampiran } from "@/types/materi";

export default async function MateriDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("materi")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  const materi = data as Materi | null;

  if (!materi) {
    notFound();
  }

  const { data: subMateriData } = await supabase
    .from("materi_lampiran")
    .select("*")
    .eq("materi_id", materi.id)
    .order("urutan", { ascending: true });

  const subMateri = (subMateriData ?? []) as MateriLampiran[];

  return (
    <div>
      <SetPageBack href="/materi" label="Kembali ke daftar materi" />

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/materi"
              title="Kembali ke daftar materi"
              className="shrink-0 p-1.5 -ml-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">{materi.judul}</h1>
          </div>

          {subMateri.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {subMateri.map((item) => (
                <a
                  key={item.id}
                  href={materiFileViewUrl(item.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm font-medium px-3 py-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0" />
                  {item.judul}
                </a>
              ))}
            </div>
          )}
        </div>

        {materi.file_url && <MateriFileViewer fileUrl={materi.file_url} fileName={materi.file_name} />}
      </div>
    </div>
  );
}
