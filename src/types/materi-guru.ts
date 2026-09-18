import type { Kelas } from "@/types/materi";

export type MateriGuruKategori = "Bahan Ajar" | "Presentasi" | "Lainnya";

export type MateriGuru = {
  id: string;
  kelas: Kelas;
  judul: string;
  kategori: MateriGuruKategori;
  label_bab: string | null;
  label_tp: string | null;
  url: string;
  keterangan: string | null;
  urutan: number;
  created_at: string;
};
