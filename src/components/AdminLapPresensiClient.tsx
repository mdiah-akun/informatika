"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import { KODE_PRESENSI, type KodePresensi, type PresensiIsi, type PresensiSesi } from "@/types/presensi";
import type { Siswa } from "@/types/siswa";
import type { Kelas } from "@/types/materi";
import { Loader2 } from "lucide-react";

type SiswaRingkas = Pick<Siswa, "id" | "nama" | "kelas">;

const ROMAN: Record<Kelas, string> = { 7: "VII", 8: "VIII", 9: "IX" };
const KODE = KODE_PRESENSI.map((k) => k.kode);

function bulanTahun(tgl: string): string {
  return new Date(`${tgl}T00:00:00`)
    .toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    .toUpperCase();
}

function hari(tgl: string): number {
  return new Date(`${tgl}T00:00:00`).getDate();
}

function persen(bagian: number, total: number): string {
  if (total === 0) return "-";
  return `${(bagian / total * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}

export default function AdminLapPresensiClient({ siswaList }: { siswaList: SiswaRingkas[] }) {
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [rombel, setRombel] = useState("");
  const [sesi, setSesi] = useState<PresensiSesi[]>([]);
  const [nilai, setNilai] = useState<Record<string, KodePresensi>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rombelOpsi = Array.from(
    new Set(siswaList.map((s) => s.kelas).filter((r) => r.startsWith(`${ROMAN[kelas]}.`)))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const rombelAktif = rombelOpsi.includes(rombel) ? rombel : (rombelOpsi[0] ?? "");
  const siswa = siswaList
    .filter((s) => s.kelas === rombelAktif)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const kelompokBulan: { label: string; jumlah: number }[] = [];
  for (const s of sesi) {
    const label = bulanTahun(s.tanggal);
    const last = kelompokBulan[kelompokBulan.length - 1];
    if (last && last.label === label) last.jumlah += 1;
    else kelompokBulan.push({ label, jumlah: 1 });
  }

  useEffect(() => {
    if (!rombelAktif) {
      setSesi([]);
      setNilai({});
      return;
    }
    let batal = false;
    async function muat() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: sesiRows, error: sesiErr } = await supabase
        .from("presensi_sesi")
        .select("*")
        .eq("rombel", rombelAktif)
        .order("tanggal", { ascending: true });
      if (batal) return;
      if (sesiErr) {
        setLoading(false);
        setError(sesiErr.message);
        setSesi([]);
        setNilai({});
        return;
      }
      const daftarSesi = (sesiRows ?? []) as PresensiSesi[];
      const peta: Record<string, KodePresensi> = {};
      if (daftarSesi.length > 0) {
        const { data: isiRows, error: isiErr } = await supabase
          .from("presensi_isi")
          .select("sesi_id, siswa_id, status")
          .in("sesi_id", daftarSesi.map((s) => s.id));
        if (batal) return;
        if (isiErr) {
          setLoading(false);
          setError(isiErr.message);
          return;
        }
        for (const r of (isiRows ?? []) as Pick<PresensiIsi, "sesi_id" | "siswa_id" | "status">[]) {
          peta[`${r.sesi_id}|${r.siswa_id}`] = r.status;
        }
      }
      setSesi(daftarSesi);
      setNilai(peta);
      setLoading(false);
    }
    muat();
    return () => {
      batal = true;
    };
  }, [rombelAktif]);

  function hitung(siswaId: string): Record<KodePresensi, number> {
    const jumlah = Object.fromEntries(KODE.map((k) => [k, 0])) as Record<KodePresensi, number>;
    for (const s of sesi) {
      const v = nilai[`${s.id}|${siswaId}`];
      if (v) jumlah[v] += 1;
    }
    return jumlah;
  }

  const th = "border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center font-medium";
  const td = "border border-slate-300 dark:border-slate-600 text-center";
  const thAbu = "bg-slate-200 dark:bg-slate-600";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Lap. Presensi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Rekap kehadiran per kelas beserta jumlah tiap kode dan persentase kehadiran. Data diisi di menu Presensi.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-4">
        {KELAS_LIST.map((k) => (
          <button
            key={k}
            onClick={() => {
              setKelas(k);
              setRombel("");
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              kelas === k
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {kelasLabel(k)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={rombelAktif}
          onChange={(e) => setRombel(e.target.value)}
          disabled={rombelOpsi.length === 0}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {rombelOpsi.length === 0 && <option value="">Belum ada kelas</option>}
          {rombelOpsi.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-500 dark:text-slate-400">Jumlah pertemuan: {sesi.length}</span>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : siswa.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center text-slate-400 dark:text-slate-500">
          Belum ada siswa untuk {kelasLabel(kelas)}.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-auto max-h-[75vh]">
          <table className="border-collapse text-sm text-slate-800 dark:text-slate-200">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/40">
                <th rowSpan={3} className={`${th} sticky left-0 z-10 bg-slate-50 dark:bg-slate-700 w-12`}>
                  No
                </th>
                <th rowSpan={3} className={`${th} sticky left-12 z-10 bg-slate-50 dark:bg-slate-700 min-w-[220px]`}>
                  Nama Siswa
                </th>
                {kelompokBulan.map((b, i) => (
                  <th key={i} colSpan={b.jumlah} className={th}>
                    {b.label}
                  </th>
                ))}
                <th colSpan={KODE.length} rowSpan={2} className={`${th} tracking-[0.5em]`}>
                  Jumlah
                </th>
                <th colSpan={2} rowSpan={2} className={th}>
                  Jml
                  <br />
                  (%)
                </th>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-700/40">
                {sesi.map((s) => (
                  <th key={s.id} className={`${th} min-w-[40px]`}>
                    {hari(s.tanggal)}
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-700/40">
                {sesi.map((s, i) => (
                  <th key={s.id} className={`${th} italic font-normal text-xs text-slate-500 dark:text-slate-400`}>
                    {i + 1}
                  </th>
                ))}
                {KODE.map((k) => (
                  <th key={k} className={`${th} ${thAbu} min-w-[36px]`}>
                    {k}
                  </th>
                ))}
                <th className={`${th} ${thAbu} min-w-[64px]`}>Hadir</th>
                <th className={`${th} ${thAbu} min-w-[64px]`}>HLG</th>
              </tr>
            </thead>
            <tbody>
              {siswa.map((s, baris) => {
                const jumlah = hitung(s.id);
                const total = sesi.length;
                return (
                  <tr key={s.id} className="hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                    <td className={`${td} sticky left-0 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400`}>
                      {baris + 1}
                    </td>
                    <td className={`${td} sticky left-12 bg-white dark:bg-slate-800 text-left px-2 py-1 font-medium whitespace-nowrap`}>
                      {s.nama}
                    </td>
                    {sesi.map((x) => (
                      <td key={x.id} className={`${td} h-8 font-semibold`}>
                        {nilai[`${x.id}|${s.id}`] ?? ""}
                      </td>
                    ))}
                    {KODE.map((k) => (
                      <td key={k} className={td}>
                        {jumlah[k] > 0 ? jumlah[k] : ""}
                      </td>
                    ))}
                    <td className={`${td} px-2 font-medium`}>{persen(jumlah.H, total)}</td>
                    <td className={`${td} px-2 font-medium`}>{persen(jumlah.H + jumlah.L + jumlah.G, total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        <span className="font-medium">Ket.:</span>{" "}
        {KODE_PRESENSI.map((k, i) => (
          <span key={k.kode}>
            <span className="font-bold">{k.kode}</span>={k.label}
            {i < KODE_PRESENSI.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        Hadir = jumlah H. HLG = jumlah H + L + G. Persentase dihitung terhadap seluruh pertemuan ({sesi.length}).
      </p>
    </div>
  );
}
