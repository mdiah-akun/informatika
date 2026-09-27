export type TpSemester = "Ganjil" | "Genap";

export const SEMESTER_LIST: TpSemester[] = ["Ganjil", "Genap"];

export type TP = {
  id: string;
  bab_id: string;
  kode: string;
  semester: TpSemester;
  deskripsi: string;
  urutan: number;
  created_at: string;
};
