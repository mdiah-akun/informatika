export type TpNilaiKolom = {
  id: string;
  tp_id: string;
  rombel: string;
  tanggal: string | null;
  judul: string;
  urutan: number;
  created_at: string;
};

export type TpNilai = {
  id: string;
  kolom_id: string;
  siswa_id: string;
  nilai: number;
  created_at: string;
};
