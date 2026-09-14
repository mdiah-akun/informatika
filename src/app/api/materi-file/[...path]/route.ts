import { NextResponse } from "next/server";
import { EXT_CONTENT_TYPE } from "@/lib/file-types";
import { createClient } from "@/lib/supabase/server";

/** Proxy file materi dari Supabase Storage dengan Content-Type yang benar.
 *  Supabase sengaja menyajikan file publik bertipe text/html (juga svg/xml)
 *  sebagai text/plain -- proteksi anti stored-XSS di domain mereka -- jadi
 *  dibuka langsung akan menampilkan tag mentah, bukan halaman ter-render.
 *  Route ini mengambil bytes-nya lalu mengirim ulang dengan Content-Type
 *  yang kita tentukan sendiri berdasarkan ekstensi file.
 *
 *  Proxy.ts (middleware auth) sengaja melewatkan semua path /api/* tanpa
 *  cek login (supaya route API lain yang punya cek sendiri, mis. admin
 *  users, tidak double-check) -- jadi rute ini WAJIB verifikasi sesi
 *  sendiri di sini. Tanpa ini, link file materi bisa disimpan/di-bookmark
 *  siswa dan tetap bisa diakses tanpa login sama sekali. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Anda harus login untuk mengakses file ini", { status: 401 });
  }

  const { path } = await params;
  const objectPath = path.map(encodeURIComponent).join("/");
  const upstreamUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/materi-file/${objectPath}`;

  const upstream = await fetch(upstreamUrl);
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("File tidak ditemukan", { status: 404 });
  }

  const ext = path[path.length - 1]?.split(".").pop()?.toLowerCase();
  const contentType = (ext && EXT_CONTENT_TYPE[ext]) || upstream.headers.get("content-type") || "application/octet-stream";

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      // "private" (bukan "public") supaya CDN/shared cache tidak ikut
      // menyimpan & menyajikan ulang file ini ke orang yang belum login.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
