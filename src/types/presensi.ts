export type KodePresensi = "H" | "S" | "I" | "L" | "M" | "A" | "P" | "G";

export const KODE_PRESENSI: { kode: KodePresensi; label: string }[] = [
  { kode: "H", label: "Hadir" },
  { kode: "S", label: "Sakit" },
  { kode: "I", label: "Ijin" },
  { kode: "L", label: "Terlambat" },
  { kode: "M", label: "Minggat/ tidak masuk kelas" },
  { kode: "A", label: "Alpa" },
  { kode: "P", label: "Pulang" },
  { kode: "G", label: "Dipanggil Guru" },
];

export type PresensiSesi = {
  id: string;
  rombel: string;
  tanggal: string;
  created_at: string;
};

export type PresensiIsi = {
  id: string;
  sesi_id: string;
  siswa_id: string;
  status: KodePresensi;
  created_at: string;
};
