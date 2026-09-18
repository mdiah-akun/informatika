import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kelasFromRombel } from "@/lib/rombel";
import { seededShuffle } from "@/lib/soal-runtime";
import type { SoalJenis, SoalAttempt } from "@/types/soal";

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
    .from("soal_pengaturan")
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
    .from("soal_attempt")
    .select("*")
    .eq("siswa_id", user.id)
    .eq("kelas", kelas)
    .eq("jenis", jenis)
    .maybeSingle();

  if (existing && (existing as SoalAttempt).status === "selesai") {
    const a = existing as SoalAttempt;
    return NextResponse.json({ done: true, skor: a.skor, jumlahBenar: a.jumlah_benar, jumlahSoal: a.jumlah_soal });
  }

  const { data: soalRows } = await admin
    .from("soal")
    .select(
      "id, pertanyaan, gambar_soal_url, opsi_a, opsi_a_gambar_url, opsi_b, opsi_b_gambar_url, opsi_c, opsi_c_gambar_url, opsi_d, opsi_d_gambar_url, urutan"
    )
    .eq("kelas", kelas)
    .eq("jenis", jenis)
    .order("urutan", { ascending: true });

  if (!soalRows || soalRows.length === 0) {
    return NextResponse.json({ error: "Belum ada soal tersedia untuk kelasmu." }, { status: 404 });
  }

  const durasiMenit = pengaturan?.durasi_menit ?? 60;

  let attempt = existing as SoalAttempt | null;
  if (!attempt) {
    const mulaiAt = new Date();
    const batasAt = new Date(mulaiAt.getTime() + durasiMenit * 60_000);
    const { data: created, error } = await admin
      .from("soal_attempt")
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
      // Permintaan ganda hampir bersamaan (mis. React StrictMode di dev)
      // sudah membuat baris attempt lebih dulu -- pakai baris itu saja.
      const { data: existingNow } = await admin
        .from("soal_attempt")
        .select("*")
        .eq("siswa_id", user.id)
        .eq("kelas", kelas)
        .eq("jenis", jenis)
        .maybeSingle();
      if (!existingNow) {
        return NextResponse.json({ error: "Gagal memulai pengerjaan." }, { status: 500 });
      }
      attempt = existingNow as SoalAttempt;
    } else if (error || !created) {
      return NextResponse.json({ error: error?.message ?? "Gagal memulai pengerjaan." }, { status: 500 });
    } else {
      attempt = created as SoalAttempt;
    }
  }

  const soalTerurut = pengaturan?.acak_soal
    ? seededShuffle(soalRows, attempt.id, (s) => s.id)
    : [...soalRows].sort((a, b) => a.urutan - b.urutan);

  const soalUntukSiswa = soalTerurut.map((s) => {
    const opsiAsli = [
      { label: "A", teks: s.opsi_a, gambar: s.opsi_a_gambar_url },
      { label: "B", teks: s.opsi_b, gambar: s.opsi_b_gambar_url },
      { label: "C", teks: s.opsi_c, gambar: s.opsi_c_gambar_url },
      { label: "D", teks: s.opsi_d, gambar: s.opsi_d_gambar_url },
    ];
    const opsi = pengaturan?.acak_opsi
      ? seededShuffle(opsiAsli, `${attempt!.id}:${s.id}`, (o) => o.label)
      : opsiAsli;
    return { id: s.id, pertanyaan: s.pertanyaan, gambarUrl: s.gambar_soal_url, opsi };
  });

  const sisaDetik = Math.max(0, Math.floor((new Date(attempt.batas_at).getTime() - now.getTime()) / 1000));

  return NextResponse.json({
    attemptId: attempt.id,
    sisaDetik,
    jawabanTersimpan: attempt.jawaban ?? {},
    soal: soalUntukSiswa,
    batasPelanggaran: pengaturan?.batas_pelanggaran ?? null,
    jumlahPelanggaranTersimpan: attempt.jumlah_pelanggaran ?? 0,
  });
}
