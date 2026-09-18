import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kelasFromRombel } from "@/lib/rombel";
import type { SoalJenis } from "@/types/soal";
import type { SoalEssaiAttempt } from "@/types/soal-essai";

const JENIS_VALID: SoalJenis[] = ["harian", "sts", "sas"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const body = await request.json();
  const jenis = body.jenis as SoalJenis;
  if (!JENIS_VALID.includes(jenis)) {
    return NextResponse.json({ error: "Jenis soal tidak valid." }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("kelas").eq("id", user.id).maybeSingle();
  const kelas = kelasFromRombel(profile?.kelas);
  if (!kelas) {
    return NextResponse.json({ error: "Kelas kamu belum diatur, hubungi admin." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: pengaturan } = await admin
    .from("soal_essai_pengaturan")
    .select("*")
    .eq("kelas", kelas)
    .eq("jenis", jenis)
    .maybeSingle();

  const now = new Date();
  if (pengaturan?.mulai_at && now < new Date(pengaturan.mulai_at)) {
    return NextResponse.json(
      { error: `Soal belum bisa dikerjakan. Mulai tersedia ${new Date(pengaturan.mulai_at).toLocaleString("id-ID")}.` },
      { status: 403 }
    );
  }
  if (pengaturan?.selesai_at && now > new Date(pengaturan.selesai_at)) {
    return NextResponse.json({ error: "Waktu pengerjaan untuk soal ini sudah berakhir." }, { status: 403 });
  }

  const { data: existing } = await admin
    .from("soal_essai_attempt")
    .select("*")
    .eq("siswa_id", user.id)
    .eq("kelas", kelas)
    .eq("jenis", jenis)
    .maybeSingle();

  if (existing && (existing as SoalEssaiAttempt).status === "selesai") {
    return NextResponse.json({ done: true });
  }

  const { data: soalRows } = await admin
    .from("soal_essai")
    .select("id, pertanyaan, gambar_soal_url, urutan")
    .eq("kelas", kelas)
    .eq("jenis", jenis)
    .order("urutan", { ascending: true });

  if (!soalRows || soalRows.length === 0) {
    return NextResponse.json({ error: "Belum ada soal essai tersedia untuk kelasmu." }, { status: 404 });
  }

  const durasiMenit = pengaturan?.durasi_menit ?? 60;

  let attempt = existing as SoalEssaiAttempt | null;
  if (!attempt) {
    const mulaiAt = new Date();
    const batasAt = new Date(mulaiAt.getTime() + durasiMenit * 60_000);
    const { data: created, error } = await admin
      .from("soal_essai_attempt")
      .insert({
        siswa_id: user.id,
        kelas,
        jenis,
        mulai_at: mulaiAt.toISOString(),
        batas_at: batasAt.toISOString(),
        status: "berjalan",
      })
      .select()
      .single();
    if (error?.code === "23505") {
      const { data: existingNow } = await admin
        .from("soal_essai_attempt")
        .select("*")
        .eq("siswa_id", user.id)
        .eq("kelas", kelas)
        .eq("jenis", jenis)
        .maybeSingle();
      if (!existingNow) {
        return NextResponse.json({ error: "Gagal memulai pengerjaan." }, { status: 500 });
      }
      attempt = existingNow as SoalEssaiAttempt;
    } else if (error || !created) {
      return NextResponse.json({ error: error?.message ?? "Gagal memulai pengerjaan." }, { status: 500 });
    } else {
      attempt = created as SoalEssaiAttempt;
    }
  }

  const sisaDetik = Math.max(0, Math.floor((new Date(attempt.batas_at).getTime() - now.getTime()) / 1000));

  return NextResponse.json({
    attemptId: attempt.id,
    sisaDetik,
    jawabanTersimpan: attempt.jawaban ?? {},
    soal: soalRows.map((s) => ({ id: s.id, pertanyaan: s.pertanyaan, gambarUrl: s.gambar_soal_url })),
    batasPelanggaran: pengaturan?.batas_pelanggaran ?? null,
  });
}
