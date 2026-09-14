import type { Kelas } from "@/types/materi";

export type EbookJenis = "guru" | "siswa";

export type Ebook = {
  id: string;
  jenis: EbookJenis;
  kelas: Kelas;
  judul: string;
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  urutan: number;
  created_at: string;
};
