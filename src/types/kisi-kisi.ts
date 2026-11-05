import type { Kelas } from "@/types/materi";

export type KisiKisi = {
  id: string;
  kelas: Kelas;
  judul: string;
  isi: string;
  url: string | null;
  urutan: number;
  created_at: string;
};
