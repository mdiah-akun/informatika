import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];

// Supabase "Time-box user sessions" butuh upgrade plan berbayar, jadi kita
// tegakkan sendiri di sini: paksa login ulang kalau sudah lebih dari
// sekian lama sejak login TERAKHIR (bukan sejak aktivitas terakhir --
// last_sign_in_at hanya berubah saat benar-benar login ulang, tidak ikut
// berubah saat access token di-refresh otomatis di background).
const SESSION_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 hari

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Redirect helper yang selalu bawa cookie terbaru dari supabaseResponse
  // (penting waktu signOut() di bawah -- cookie sesi yang dihapus harus
  // ikut terbawa ke response redirect, bukan cuma ke supabaseResponse yang
  // tidak jadi dipakai).
  function redirectTo(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  }

  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.last_sign_in_at) {
    const signedInAt = new Date(user.last_sign_in_at).getTime();
    if (Date.now() - signedInAt > SESSION_MAX_AGE_MS) {
      await supabase.auth.signOut();
      user = null;
    }
  }

  const path = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublicPath) {
    return redirectTo("/login");
  }

  if (!user) {
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role ?? "siswa";

  if (isPublicPath) {
    return redirectTo(role === "admin" ? "/admin/materi" : "/materi");
  }

  if (path.startsWith("/admin") && role !== "admin") {
    return redirectTo("/materi");
  }

  return supabaseResponse;
}
