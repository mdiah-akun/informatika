export type NilaiBobot = {
  id: number;
  bobot_f: number;
  bobot_s: number;
  bobot_sa: number;
  persen_akademik: number;
  persen_kehadiran: number;
  persen_lain: number;
  persen_punishment: number;
  tp_pakai_ambang: boolean;
  tp_batas_optimum: number;
  tp_batas_minimum: number;
  updated_at: string;
};

export const BOBOT_DEFAULT = {
  bobot_f: 1,
  bobot_s: 2, bobot_sa: 2,
  persen_akademik: 90,
  persen_kehadiran: 10,
  persen_lain: 5,
  persen_punishment: 5,
  tp_pakai_ambang: true,
  tp_batas_optimum: 68,
  tp_batas_minimum: 67,
};
