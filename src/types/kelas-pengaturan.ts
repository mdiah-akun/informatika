export const NILAI_RAPOT_OPSI = ["Asli", "Asli+Hadir", "Dongkrak(asli)", "Dongkrak(AsliHadir)"] as const;

export type NilaiRapot = (typeof NILAI_RAPOT_OPSI)[number];

export type KelasPengaturan = {
  rombel: string;
  wali_kelas: string;
  nilai_rapot: NilaiRapot | null;
  dongkrak_min: number | null;
  dongkrak_max: number | null;
  updated_at: string;
};
