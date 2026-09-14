export type Siswa = {
  id: string;
  nisn: string | null;
  nama: string;
  /** Rombel lengkap, mis. "VII.1", "VIII.2", "IX.3". */
  kelas: string;
  created_at: string;
};
