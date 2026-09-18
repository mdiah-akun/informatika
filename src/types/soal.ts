import type { Kelas } from "@/types/materi";

export type SoalJenis = "harian" | "sts" | "sas";
export type KunciJawaban = "A" | "B" | "C" | "D";

export type Soal = {
  id: string;
  kelas: Kelas;
  label_tp: string | null;
  jenis: SoalJenis;
  pertanyaan: string;
  gambar_soal_url: string | null;
  opsi_a: string | null;
  opsi_a_gambar_url: string | null;
  opsi_b: string | null;
  opsi_b_gambar_url: string | null;
  opsi_c: string | null;
  opsi_c_gambar_url: string | null;
  opsi_d: string | null;
  opsi_d_gambar_url: string | null;
  kunci_jawaban: KunciJawaban;
  urutan: number;
  created_at: string;
};

export type SoalPengaturan = {
  kelas: Kelas;
  jenis: SoalJenis;
  acak_soal: boolean;
  acak_opsi: boolean;
  mulai_at: string | null;
  selesai_at: string | null;
  durasi_menit: number;
  batas_pelanggaran: number | null;
  updated_at: string;
};

export type SoalAttemptStatus = "berjalan" | "selesai";

export type SoalAttempt = {
  id: string;
  siswa_id: string;
  kelas: Kelas;
  jenis: SoalJenis;
  mulai_at: string;
  batas_at: string;
  selesai_at: string | null;
  jawaban: Record<string, KunciJawaban>;
  skor: number | null;
  jumlah_benar: number | null;
  jumlah_soal: number | null;
  jumlah_pelanggaran: number;
  status: SoalAttemptStatus;
  created_at: string;
};
