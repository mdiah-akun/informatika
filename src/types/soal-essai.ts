import type { Kelas } from "@/types/materi";
import type { SoalJenis } from "@/types/soal";

export type SoalEssai = {
  id: string;
  kelas: Kelas;
  label_tp: string | null;
  jenis: SoalJenis;
  pertanyaan: string;
  gambar_soal_url: string | null;
  kunci_jawaban: string;
  skor_maksimal: number;
  urutan: number;
  created_at: string;
};

export type SoalEssaiPengaturan = {
  kelas: Kelas;
  jenis: SoalJenis;
  mulai_at: string | null;
  selesai_at: string | null;
  durasi_menit: number;
  batas_pelanggaran: number | null;
  updated_at: string;
};

export type SoalEssaiAttemptStatus = "berjalan" | "selesai";

export type SoalEssaiAttempt = {
  id: string;
  siswa_id: string;
  kelas: Kelas;
  jenis: SoalJenis;
  mulai_at: string;
  batas_at: string;
  selesai_at: string | null;
  jawaban: Record<string, string>;
  jumlah_pelanggaran: number;
  skor: Record<string, { skor: number; alasan: string }>;
  skor_total: number | null;
  dikoreksi_at: string | null;
  status: SoalEssaiAttemptStatus;
  created_at: string;
};
