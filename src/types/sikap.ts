export type SikapJenis = "positif" | "negatif";

export type SikapCatatan = {
  id: string;
  siswa_id: string;
  sikap_id: string | null;
  jenis: SikapJenis;
  nama: string;
  poin: number;
  tanggal: string;
  created_at: string;
};

export type Sikap = {
  id: string;
  jenis: SikapJenis;
  nama: string;
  poin: number;
  urutan: number;
  created_at: string;
};
