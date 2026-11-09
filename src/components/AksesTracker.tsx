"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Mencatat halaman yang dibuka pengguna ke tabel akses_log (dibaca di menu
 *  Akses Pengguna). Gagal mencatat tidak boleh mengganggu pengguna. */
export default function AksesTracker() {
  const pathname = usePathname();
  const terakhir = useRef<string | null>(null);

  useEffect(() => {
    if (terakhir.current === pathname) return;
    terakhir.current = pathname;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("akses_log").insert({ user_id: user.id, jenis: "halaman", path: pathname });
      } catch {
        /* diabaikan */
      }
    })();
  }, [pathname]);

  return null;
}
