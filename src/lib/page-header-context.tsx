"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type BackLink = { href: string; label: string } | null;

const PageHeaderContext = createContext<{
  back: BackLink;
  setBack: (b: BackLink) => void;
} | null>(null);

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [back, setBack] = useState<BackLink>(null);
  return <PageHeaderContext.Provider value={{ back, setBack }}>{children}</PageHeaderContext.Provider>;
}

function usePageHeaderContext() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("usePageHeaderContext harus dipakai di dalam PageHeaderProvider");
  return ctx;
}

/** Dibaca oleh TopBar untuk menampilkan link "kembali" kalau ada halaman
 *  yang men-set-nya lewat <SetPageBack>. */
export function usePageBack() {
  return usePageHeaderContext().back;
}

/** Taruh di halaman manapun yang butuh link "kembali" di TopBar (bukan di
 *  konten halaman) -- mis. halaman detail yang mau tombol back di sebelah
 *  ikon menu, bukan di badan halaman. */
export function SetPageBack({ href, label }: { href: string; label: string }) {
  const { setBack } = usePageHeaderContext();
  // useCallback bukan untuk memoisasi lintas render di sini, cuma supaya
  // effect di bawah tidak butuh setBack sebagai dependency yang berubah.
  const clear = useCallback(() => setBack(null), [setBack]);

  useEffect(() => {
    setBack({ href, label });
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [href, label]);

  return null;
}
