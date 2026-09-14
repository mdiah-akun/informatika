import { NextResponse } from "next/server";
import { requireAdminUser, createAdminClient } from "@/lib/supabase/admin";
import { buildSiswaEmail } from "@/lib/siswa-account";

type ImportItem = { nisn: string; nama: string; kelas: string };

/** Buat akun login siswa massal dari data roster (tabel siswa). Email
 *  dibentuk dari NISN, password awal = NISN juga (siswa pasti sudah tahu
 *  NISN-nya sendiri). Tiap baris diproses independen -- kalau satu gagal
 *  (mis. akun sudah ada), baris lain tetap lanjut diproses. */
export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const body = await request.json();
  const siswa: ImportItem[] = Array.isArray(body?.siswa) ? body.siswa : [];

  if (siswa.length === 0) {
    return NextResponse.json({ error: "Tidak ada siswa yang dipilih" }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const results: { nisn: string; nama: string; email: string | null; success: boolean; error: string | null }[] = [];

  for (const item of siswa) {
    const nisn = String(item.nisn ?? "").trim();
    const nama = String(item.nama ?? "").trim();
    const kelas = String(item.kelas ?? "").trim();

    if (!nisn) {
      results.push({ nisn, nama, email: null, success: false, error: "NISN kosong" });
      continue;
    }
    if (nisn.length < 6) {
      results.push({ nisn, nama, email: null, success: false, error: "NISN kurang dari 6 karakter (dipakai sebagai password)" });
      continue;
    }

    const email = buildSiswaEmail(nisn);
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: nisn,
      email_confirm: true,
      user_metadata: { nama, kelas },
    });

    results.push({ nisn, nama, email, success: !error, error: error?.message ?? null });
  }

  return NextResponse.json({ results });
}
