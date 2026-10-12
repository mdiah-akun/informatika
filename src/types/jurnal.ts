import type { Kelas } from "@/types/materi";

export type JurnalMengajar = {
  id: string;
  kelas: Kelas;
  rombel: string;
  pertemuan_ke: number;
  tanggal: string;
  jam_ke: string;
  pokok_bahasan: string;
  ketercapaian: string;
  catatan_sikap: string;
  pesan_harian: string;
  created_at: string;
};
