import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSiswaEmail } from "@/lib/siswa-account";
import { menuLabel } from "@/lib/menu-label";
import AdminAksesPenggunaClient, { type BarisAkses } from "@/components/AdminAksesPenggunaClient";

type Ringkasan = {
  user_id: string;
  jumlah_login: number;
  jumlah_akses: number;
  terakhir_akses: string | null;
  terakhir_path: string | null;
};

export default async function AdminAksesPenggunaPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: siswa } = await supabase
    .from("siswa")
    .select("id, nisn, nama, kelas")
    .order("nama", { ascending: true })
    .range(0, 4999);

  const akunPerEmail = new Map<string, { id: string; terakhirLogin: string | null }>();
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) break;
    for (const u of data.users) {
      if (u.email) akunPerEmail.set(u.email.toLowerCase(), { id: u.id, terakhirLogin: u.last_sign_in_at ?? null });
    }
    if (data.users.length < 1000) break;
  }

  const { data: ringkasan, error: errRingkasan } = await admin.rpc("akses_ringkasan");
  const perAkun = new Map<string, Ringkasan>();
  for (const r of (ringkasan ?? []) as Ringkasan[]) perAkun.set(r.user_id, r);

  const baris: BarisAkses[] = (siswa ?? []).map((s) => {
    const akun = s.nisn ? akunPerEmail.get(buildSiswaEmail(s.nisn).toLowerCase()) : undefined;
    const r = akun ? perAkun.get(akun.id) : undefined;
    const jumlahLogin = Number(r?.jumlah_login ?? 0);
    return {
      id: s.id,
      nisn: s.nisn ?? "",
      nama: s.nama,
      kelas: s.kelas,
      punyaAkun: !!akun,
      sudahLogin: !!akun?.terakhirLogin || jumlahLogin > 0,
      terakhirLogin: akun?.terakhirLogin ?? null,
      jumlahLogin,
      jumlahAkses: Number(r?.jumlah_akses ?? 0),
      terakhirAkses: r?.terakhir_akses ?? null,
      menuTerakhir: r?.terakhir_path ? menuLabel(r.terakhir_path) : null,
    };
  });

  return <AdminAksesPenggunaClient baris={baris} logSiap={!errRingkasan} />;
}
