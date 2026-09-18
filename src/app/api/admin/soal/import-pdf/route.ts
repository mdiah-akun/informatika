import path from "node:path";
import { pathToFileURL } from "node:url";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import { parseSoalFromText } from "@/lib/soal-parser";

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File PDF wajib diunggah." }, { status: 400 });
  }

  let text: string;
  try {
    const { PDFParse } = await import("pdf-parse");
    // Turbopack membundel pdf-parse, jadi PDF.js tidak bisa menemukan
    // pdf.worker.mjs dari lokasi bundle relatifnya sendiri di server --
    // arahkan langsung ke file worker di node_modules.
    const workerPath = path.join(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs");
    PDFParse.setWorker(pathToFileURL(workerPath).href);

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    text = result.text;
  } catch (err) {
    console.error("Gagal membaca PDF:", err);
    return NextResponse.json({ error: "Gagal membaca file PDF. Pastikan file tidak rusak/terkunci." }, { status: 400 });
  }

  const soal = parseSoalFromText(text);
  if (soal.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada soal yang terdeteksi. Pastikan format nomor (1., 2., ...) dan opsi (A. B. C. D.) sesuai." },
      { status: 400 }
    );
  }

  return NextResponse.json({ soal });
}
