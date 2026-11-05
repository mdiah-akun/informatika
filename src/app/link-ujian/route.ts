import { NextResponse } from "next/server";
import { URL_UJIAN } from "@/lib/link-ujian";

// Tautan pendek untuk siswa: langsung diarahkan ke situs ujian. Tidak butuh
// login, supaya QR bisa dipindai langsung dari kamera HP (lihat updateSession).
export function GET() {
  return NextResponse.redirect(URL_UJIAN, 307);
}
