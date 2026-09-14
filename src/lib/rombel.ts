import type { Kelas } from "@/types/materi";

export const TINGKAT_LIST = ["VII", "VIII", "IX"] as const;
export type Tingkat = (typeof TINGKAT_LIST)[number];

const TINGKAT_TO_KELAS: Record<Tingkat, Kelas> = { VII: 7, VIII: 8, IX: 9 };

/** Ambil tingkat (7/8/9) dari kode rombel, mis. "VII.6" -> 7. Kembalikan
 *  null kalau rombel-nya kosong/tidak dikenali (mis. profil admin). */
export function kelasFromRombel(rombel: string | null | undefined): Kelas | null {
  if (!rombel) return null;
  const { tingkat } = parseRombel(rombel);
  return TINGKAT_TO_KELAS[tingkat] ?? null;
}

/** Gabungkan tingkat + nomor jadi kode rombel, mis. ("VII", "1") -> "VII.1".
 *  Nomor kosong -> cuma tingkatnya saja, mis. "VII". */
export function buildRombel(tingkat: Tingkat, nomor: string): string {
  const n = nomor.trim();
  return n ? `${tingkat}.${n}` : tingkat;
}

/** Pecah kode rombel jadi tingkat + nomor, mis. "VII.1" -> { tingkat: "VII", nomor: "1" }. */
export function parseRombel(kelas: string): { tingkat: Tingkat; nomor: string } {
  const match = kelas.trim().toUpperCase().match(/^(VII|VIII|IX)(?:\.(\d+))?$/);
  if (!match) return { tingkat: "VII", nomor: "" };
  return { tingkat: match[1] as Tingkat, nomor: match[2] ?? "" };
}

/** Urutkan kode rombel: per tingkat (VII, VIII, IX) dulu, lalu per nomor. */
export function compareRombel(a: string, b: string): number {
  const pa = parseRombel(a);
  const pb = parseRombel(b);
  const diffTingkat = TINGKAT_LIST.indexOf(pa.tingkat) - TINGKAT_LIST.indexOf(pb.tingkat);
  if (diffTingkat !== 0) return diffTingkat;
  return (Number(pa.nomor) || 0) - (Number(pb.nomor) || 0);
}
