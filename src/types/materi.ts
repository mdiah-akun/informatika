export type Profile = {
  id: string;
  nama: string;
  role: "admin" | "siswa";
  /** Rombel siswa, mis. "VII.6" -- null kalau belum diisi (mis. admin,
   *  atau siswa yang daftar mandiri lewat /signup). */
  kelas: string | null;
  created_at: string;
};

export type Kelas = 7 | 8 | 9;

export type Bab = {
  id: string;
  judul: string;
  urutan: number;
  kelas: Kelas;
  created_at: string;
};

export type Materi = {
  id: string;
  bab_id: string;
  judul: string;
  slug: string;
  konten: string;
  urutan: number;
  published: boolean;
  gambar_url: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  updated_at: string;
};

export type MateriLampiran = {
  id: string;
  materi_id: string;
  judul: string;
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  urutan: number;
  created_at: string;
};
