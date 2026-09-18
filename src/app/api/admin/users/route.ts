import { NextResponse } from "next/server";
import { requireAdminUser, createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const supabaseAdmin = createAdminClient();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, nama, role, kelas, created_at");
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p]));

  const users = authData.users.map((u) => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      nama: profile?.nama ?? "",
      role: profile?.role ?? "siswa",
      kelas: profile?.kelas ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
    };
  });

  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ users });
}
