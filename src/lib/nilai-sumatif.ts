import { createAdminClient } from "@/lib/supabase/admin";
import { buildSiswaEmail } from "@/lib/siswa-account";
import type { Siswa } from "@/types/siswa";

type SiswaRingkas = Pick<Siswa, "id" | "nisn" | "nama" | "kelas">;

/** Nilai Auto (PTS/SAS): rata-rata skor ujian online jenis "sts" atau "sas"
 *  (pilihan ganda + essai yang sudah dikoreksi) tiap siswa. Ujian terhubung
 *  ke akun login siswa, yang emailnya dibentuk dari NISN -- jadi roster
 *  dipetakan lewat NISN. */
export async function hitungNilaiAuto(
  jenis: "sts" | "sas",
  siswa: SiswaRingkas[]
): Promise<Record<string, number>> {
  const admin = createAdminClient();

  const idAkunPerEmail = new Map<string, string>();
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) break;
    for (const u of data.users) if (u.email) idAkunPerEmail.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 1000) break;
  }

  const [{ data: pg }, { data: essai }] = await Promise.all([
    admin.from("soal_attempt").select("siswa_id, skor").eq("jenis", jenis).eq("status", "selesai"),
    admin
      .from("soal_essai_attempt")
      .select("siswa_id, skor_total")
      .eq("jenis", jenis)
      .eq("status", "selesai")
      .not("skor_total", "is", null),
  ]);

  const skorPerAkun = new Map<string, number[]>();
  for (const r of (pg ?? []) as { siswa_id: string; skor: number | null }[]) {
    if (r.skor !== null) skorPerAkun.set(r.siswa_id, [...(skorPerAkun.get(r.siswa_id) ?? []), Number(r.skor)]);
  }
  for (const r of (essai ?? []) as { siswa_id: string; skor_total: number | null }[]) {
    if (r.skor_total !== null) {
      skorPerAkun.set(r.siswa_id, [...(skorPerAkun.get(r.siswa_id) ?? []), Number(r.skor_total)]);
    }
  }

  const hasil: Record<string, number> = {};
  for (const s of siswa) {
    if (!s.nisn) continue;
    const akun = idAkunPerEmail.get(buildSiswaEmail(s.nisn).toLowerCase());
    const skor = akun ? skorPerAkun.get(akun) : undefined;
    if (skor && skor.length > 0) hasil[s.id] = skor.reduce((a, b) => a + b, 0) / skor.length;
  }
  return hasil;
}
