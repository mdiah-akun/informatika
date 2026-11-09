import { NextResponse } from "next/server";
import { requireAdminUser, createAdminClient } from "@/lib/supabase/admin";
import { buildSiswaEmail } from "@/lib/siswa-account";

/** Reset password akun login siswa ke NISN-nya (sama seperti password awal
 *  saat akun dibuat lewat Import Siswa). Akun dicari lewat email yang
 *  dibentuk dari NISN. */
export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const body = await request.json();
  const nisn = String(body?.nisn ?? "").trim();
  if (!nisn) {
    return NextResponse.json({ error: "Siswa ini belum punya NISN." }, { status: 400 });
  }
  if (nisn.length < 6) {
    return NextResponse.json({ error: "NISN kurang dari 6 karakter, tidak bisa dipakai sebagai password." }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const email = buildSiswaEmail(nisn).toLowerCase();

  let userId: string | null = null;
  for (let page = 1; page < 20 && !userId; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Gagal membaca daftar akun." }, { status: 500 });
    }
    userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    if (data.users.length < 1000) break;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Siswa ini belum punya akun login. Buat dulu lewat Kelola User, Import Siswa." },
      { status: 404 }
    );
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: nisn });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
