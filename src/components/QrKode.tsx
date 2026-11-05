"use client";

import { useMemo } from "react";
import qrcode from "qrcode-generator";

// QR code SVG dari teks (dibuat di peramban, tanpa jaringan). Koreksi galat M
// supaya tetap terbaca walau tercetak kurang tajam.
export default function QrKode({ teks, className }: { teks: string; className?: string }) {
  const svg = useMemo(() => {
    const q = qrcode(0, "M");
    q.addData(teks);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }, [teks]);
  return <div className={className} role="img" aria-label={`QR code ${teks}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}
