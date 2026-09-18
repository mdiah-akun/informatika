import { NextResponse } from "next/server";
import { requireAdminUser, createAdminClient } from "@/lib/supabase/admin";
import type { SoalEssai, SoalEssaiAttempt } from "@/types/soal-essai";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY belum diisi di .env.local. Tambahkan dulu lalu restart server." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const attemptId = body.attemptId as string;
  if (!attemptId) {
    return NextResponse.json({ error: "Pengerjaan tidak valid." }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const { data: attemptRow } = await supabaseAdmin
    .from("soal_essai_attempt")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attemptRow) {
    return NextResponse.json({ error: "Pengerjaan tidak ditemukan." }, { status: 404 });
  }
  const attempt = attemptRow as SoalEssaiAttempt;

  const { data: soalRows } = await supabaseAdmin
    .from("soal_essai")
    .select("*")
    .eq("kelas", attempt.kelas)
    .eq("jenis", attempt.jenis);
  if (!soalRows || soalRows.length === 0) {
    return NextResponse.json({ error: "Soal essai tidak ditemukan." }, { status: 404 });
  }
  const soalList = soalRows as SoalEssai[];

  const daftarSoal = soalList.map((s, idx) => ({
    id: s.id,
    nomor: idx + 1,
    pertanyaan: stripHtml(s.pertanyaan),
    kunci_jawaban: stripHtml(s.kunci_jawaban),
    jawaban_siswa: attempt.jawaban[s.id]?.trim() || "(tidak dijawab)",
    skor_maksimal: s.skor_maksimal,
  }));

  const prompt = `Anda adalah guru SMP yang menilai jawaban essai siswa secara adil dan konsisten. Untuk setiap soal berikut, bandingkan "jawaban_siswa" dengan "kunci_jawaban", lalu berikan skor dari 0 sampai "skor_maksimal" (boleh angka desimal) sesuai seberapa lengkap dan tepat jawaban siswa dibanding kunci jawaban, serta alasan singkat (1-2 kalimat, Bahasa Indonesia). Jawaban yang kosong ("tidak dijawab") selalu diberi skor 0.

Soal-soal:
${JSON.stringify(daftarSoal, null, 2)}

Balas HANYA dengan JSON array valid, tanpa teks lain di luar JSON, dengan format persis:
[{"id": "...", "skor": number, "alasan": "..."}]`;

  let aiText: string;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Gagal memanggil AI (${res.status}): ${errText.slice(0, 300)}` }, { status: 502 });
    }
    const json = await res.json();
    aiText = json.content?.[0]?.text ?? "";
  } catch {
    return NextResponse.json({ error: "Gagal menghubungi layanan AI." }, { status: 502 });
  }

  let hasil: { id: string; skor: number; alasan: string }[];
  try {
    const match = aiText.match(/\[[\s\S]*\]/);
    hasil = JSON.parse(match ? match[0] : aiText);
  } catch {
    return NextResponse.json({ error: "Gagal membaca hasil analisis AI. Coba koreksi ulang." }, { status: 502 });
  }

  const skorMap: Record<string, { skor: number; alasan: string }> = {};
  let totalSkor = 0;
  let totalMaks = 0;
  for (const s of soalList) {
    const h = hasil.find((x) => x.id === s.id);
    const skor = h ? Math.max(0, Math.min(s.skor_maksimal, Number(h.skor) || 0)) : 0;
    skorMap[s.id] = { skor, alasan: h?.alasan ?? "" };
    totalSkor += skor;
    totalMaks += s.skor_maksimal;
  }
  const skorTotal = totalMaks > 0 ? Math.round((totalSkor / totalMaks) * 10000) / 100 : 0;

  const { error: updateErr } = await supabaseAdmin
    .from("soal_essai_attempt")
    .update({ skor: skorMap, skor_total: skorTotal, dikoreksi_at: new Date().toISOString() })
    .eq("id", attemptId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ skor: skorMap, skorTotal });
}
