import type { Kelas } from "@/types/materi";

export const KELAS_LIST: Kelas[] = [7, 8, 9];

const ROMAN: Record<Kelas, string> = { 7: "VII", 8: "VIII", 9: "IX" };

export function kelasLabel(kelas: Kelas): string {
  return `Kelas ${ROMAN[kelas] ?? kelas}`;
}
