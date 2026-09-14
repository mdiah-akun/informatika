import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Client Supabase dengan SERVICE ROLE KEY -- HANYA boleh dipakai di
 * server (Route Handler), TIDAK PERNAH di komponen client. Client ini
 * melewati RLS sepenuhnya, jadi setiap Route Handler yang memakainya
 * WAJIB memverifikasi dulu bahwa pemanggilnya benar admin (pakai
 * requireAdminUser di bawah).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local. Ambil dari Supabase Dashboard -> Project Settings -> API -> service_role key."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Pastikan pemanggil route ini sudah login DAN role-nya admin. Return
 *  user kalau valid, null kalau tidak (caller lalu balas 403). */
export async function requireAdminUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return null;
  return user;
}
