import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SoalEssaiAttempt } from "@/types/soal-essai";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const body = await request.json();
  const attemptId = body.attemptId as string;
  const jawaban = (body.jawaban ?? {}) as Record<string, string>;
  const final = !!body.final;
  const jumlahPelanggaran = typeof body.jumlahPelanggaran === "number" ? body.jumlahPelanggaran : undefined;

  if (!attemptId) {
    return NextResponse.json({ error: "Pengerjaan tidak valid." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: attemptRow } = await admin.from("soal_essai_attempt").select("*").eq("id", attemptId).maybeSingle();
  const attempt = attemptRow as SoalEssaiAttempt | null;

  if (!attempt || attempt.siswa_id !== user.id) {
    return NextResponse.json({ error: "Pengerjaan tidak ditemukan." }, { status: 404 });
  }

  if (attempt.status === "selesai") {
    return NextResponse.json({ submitted: true });
  }

  const patch: Record<string, unknown> = { jawaban };
  if (jumlahPelanggaran !== undefined) patch.jumlah_pelanggaran = jumlahPelanggaran;

  if (!final) {
    const { error } = await admin.from("soal_essai_attempt").update(patch).eq("id", attemptId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ saved: true });
  }

  patch.status = "selesai";
  patch.selesai_at = new Date().toISOString();

  const { error } = await admin.from("soal_essai_attempt").update(patch).eq("id", attemptId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submitted: true });
}
