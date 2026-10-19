import { createClient } from "@/lib/supabase/server";
import AdminSetingNilaiClient from "@/components/AdminSetingNilaiClient";
import { BOBOT_DEFAULT, type NilaiBobot } from "@/types/nilai-bobot";

export default async function AdminSetingNilaiPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("nilai_bobot").select("*").eq("id", 1).maybeSingle();
  const bobot = (data as NilaiBobot | null) ?? { ...BOBOT_DEFAULT };

  return (
    <AdminSetingNilaiClient
      awal={{
        f: Number(bobot.bobot_f),
        s: Number(bobot.bobot_s),
        sa: Number(bobot.bobot_sa),
        akademik: Number(bobot.persen_akademik ?? BOBOT_DEFAULT.persen_akademik),
        kehadiran: Number(bobot.persen_kehadiran ?? BOBOT_DEFAULT.persen_kehadiran),
        lain: Number(bobot.persen_lain ?? BOBOT_DEFAULT.persen_lain),
        punishment: Number(bobot.persen_punishment ?? BOBOT_DEFAULT.persen_punishment),
        pakaiAmbang: bobot.tp_pakai_ambang ?? BOBOT_DEFAULT.tp_pakai_ambang,
        optimum: Number(bobot.tp_batas_optimum ?? BOBOT_DEFAULT.tp_batas_optimum),
        minimum: Number(bobot.tp_batas_minimum ?? BOBOT_DEFAULT.tp_batas_minimum),
      }}
    />
  );
}
