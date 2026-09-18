import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SoalAttempt } from "@/types/soal";

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
  const { data: attemptRow } = await admin.from("soal_attempt").select("*").eq("id", attemptId).maybeSingle();
  const attempt = attemptRow as SoalAttempt | null;

  if (!attempt || attempt.siswa_id !== user.id) {
    return NextResponse.json({ error: "Pengerjaan tidak ditemukan." }, { status: 404 });
  }

  if (attempt.status === "selesai") {
    return NextResponse.json({ skor: attempt.skor, jumlahBenar: attempt.jumlah_benar, jumlahSoal: attempt.jumlah_soal });
  }

  if (!final) {
    // Simpan progres jawaban saja, belum dinilai.
    const patch: Record<string, unknown> = { jawaban };
    if (jumlahPelanggaran !== undefined) patch.jumlah_pelanggaran = jumlahPelanggaran;
    const { error } = await admin.from("soal_attempt").update(patch).eq("id", attemptId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ saved: true });
  }

  const { data: soalRows } = await admin
    .from("soal")
    .select("id, kunci_jawaban")
    .eq("kelas", attempt.kelas)
    .eq("jenis", attempt.jenis);

  const jumlahSoal = soalRows?.length ?? 0;
  const jumlahBenar = (soalRows ?? []).filter((s) => jawaban[s.id] === s.kunci_jawaban).length;
  const skor = jumlahSoal > 0 ? Math.round((jumlahBenar / jumlahSoal) * 10000) / 100 : 0;

  const { error } = await admin
    .from("soal_attempt")
    .update({
      jawaban,
      status: "selesai",
      selesai_at: new Date().toISOString(),
      skor,
      jumlah_benar: jumlahBenar,
      jumlah_soal: jumlahSoal,
      ...(jumlahPelanggaran !== undefined ? { jumlah_pelanggaran: jumlahPelanggaran } : {}),
    })
    .eq("id", attemptId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ skor, jumlahBenar, jumlahSoal });
}
