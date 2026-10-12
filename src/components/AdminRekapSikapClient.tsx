"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import type { SikapCatatan, SikapJenis } from "@/types/sikap";
import type { Siswa } from "@/types/siswa";
import type { Kelas } from "@/types/materi";
import { Loader2, Search } from "lucide-react";

type SiswaRingkas = Pick<Siswa, "id" | "nisn" | "nama" | "kelas">;

const ROMAN: Record<Kelas, string> = { 7: "VII", 8: "VIII", 9: "IX" };
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatTanggal(tgl: string): string {
  const [y, m, d] = tgl.split("-").map(Number);
  return `${String(d).padStart(2, "0")}-${BULAN[m - 1]}-${String(y).slice(-2)}`;
}

export default function AdminRekapSikapClient({
  jenis,
  siswaList,
}: {
  jenis: SikapJenis;
  siswaList: SiswaRingkas[];
}) {
  const positif = jenis === "positif";
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [rombel, setRombel] = useState("");
  const [cari, setCari] = useState("");
  const [terpilih, setTerpilih] = useState<string | null>(null);
  const [catatan, setCatatan] = useState<SikapCatatan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rombelOpsi = Array.from(
    new Set(siswaList.map((s) => s.kelas).filter((r) => r.startsWith(`${ROMAN[kelas]}.`)))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const rombelAktif = rombelOpsi.includes(rombel) ? rombel : (rombelOpsi[0] ?? "");
  const siswa = siswaList
    .filter((s) => s.kelas === rombelAktif)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const kataCari = cari.trim().toLowerCase();
  const siswaTampil = kataCari ? siswa.filter((s) => s.nama.toLowerCase().includes(kataCari)) : siswa;
  const siswaFokus = siswa.find((s) => s.id === terpilih) ?? null;

  useEffect(() => {
    setTerpilih(null);
    if (!rombelAktif) {
      setCatatan([]);
      return;
    }
    let batal = false;
    async function muat() {
      setLoading(true);
      setError(null);
      const ids = siswaList.filter((s) => s.kelas === rombelAktif).map((s) => s.id);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sikap_catatan")
        .select("*")
        .eq("jenis", jenis)
        .in("siswa_id", ids)
        .order("tanggal", { ascending: true })
        .order("created_at", { ascending: true });
      if (batal) return;
      setLoading(false);
      if (error) {
        setError(error.message);
        setCatatan([]);
        return;
      }
      setCatatan((data ?? []) as SikapCatatan[]);
    }
    muat();
    return () => {
      batal = true;
    };
  }, [rombelAktif, jenis, siswaList]);

  const totalPerSiswa = new Map<string, number>();
  for (const c of catatan) totalPerSiswa.set(c.siswa_id, (totalPerSiswa.get(c.siswa_id) ?? 0) + c.poin);
  const detail = catatan.filter((c) => c.siswa_id === terpilih);
  const totalDetail = detail.reduce((sum, c) => sum + c.poin, 0);

  const th = "px-2 py-1.5 font-medium text-left";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Rekap Sikap {positif ? "+" : "-"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Total poin sikap {positif ? "positif" : "negatif"} tiap siswa. Klik nama siswa untuk melihat rincian
          catatannya. Data dicatat di menu Catat Sikap {positif ? "+" : "-"}. Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-slate-200 dark:border-slate-700 mb-4">
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

        <div className="flex flex-wrap items-center gap-2 sm:ml-2 py-1">
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
          {siswaFokus ? (
            <span className="text-sm text-indigo-700 dark:text-indigo-300">
              Rincian: <span className="font-semibold">{siswaFokus.nama}</span>
            </span>
          ) : (
            <span className="text-sm text-amber-600 dark:text-amber-400">Klik nama siswa untuk melihat rincian</span>
          )}
        </div>

        <div className="relative w-full sm:w-48 sm:ml-auto py-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama siswa..."
            title="Cari nama siswa"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 pl-9 pr-2 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-auto max-h-[65vh] scroll-samar">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className={`${th} w-10`}>No</th>
                  <th className={th}>Nama</th>
                  <th className={`${th} w-24 text-center`}>Total Poin</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400 mx-auto" />
                    </td>
                  </tr>
                ) : siswaTampil.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                      {siswa.length === 0
                        ? `Belum ada siswa untuk ${kelasLabel(kelas)}.`
                        : `Tidak ada siswa yang cocok dengan "${cari.trim()}".`}
                    </td>
                  </tr>
                ) : (
                  siswaTampil.map((s, i) => {
                    const total = totalPerSiswa.get(s.id);
                    return (
                      <tr
                        key={s.id}
                        onClick={() => setTerpilih(s.id)}
                        className={`cursor-pointer border-b border-slate-100 dark:border-slate-700/60 last:border-0 ${
                          terpilih === s.id
                            ? "bg-indigo-100 dark:bg-indigo-500/25"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{i + 1}</td>
                        <td className="px-2 py-1 font-medium text-slate-800 dark:text-slate-200">{s.nama}</td>
                        <td
                          className={`px-2 py-1 text-center font-semibold ${
                            total ? "text-slate-800 dark:text-slate-100" : "text-slate-300 dark:text-slate-600"
                          }`}
                        >
                          {total ?? 0}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-auto max-h-[65vh] scroll-samar">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className={`${th} w-10`}>No</th>
                  <th className={`${th} w-28 text-center`}>Tanggal Catat</th>
                  <th className={th}>Catatan Nilai Sikap</th>
                  <th className={`${th} w-14 text-center`}>Poin</th>
                </tr>
              </thead>
              <tbody>
                {!siswaFokus ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                      Klik nama siswa di tabel kiri untuk melihat rincian.
                    </td>
                  </tr>
                ) : detail.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                      {siswaFokus.nama} belum punya catatan sikap {positif ? "positif" : "negatif"}.
                    </td>
                  </tr>
                ) : (
                  detail.map((c, i) => (
                    <tr key={c.id} className="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                      <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{i + 1}</td>
                      <td className="px-2 py-1 text-center text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatTanggal(c.tanggal)}
                      </td>
                      <td className="px-2 py-1 text-slate-800 dark:text-slate-200">{c.nama}</td>
                      <td className="px-2 py-1 text-center font-semibold text-slate-700 dark:text-slate-200">{c.poin}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {siswaFokus && detail.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60">
                    <td colSpan={3} className="px-2 py-1.5 text-right font-medium text-slate-600 dark:text-slate-300">
                      Total ({detail.length} catatan)
                    </td>
                    <td className="px-2 py-1.5 text-center font-semibold text-slate-800 dark:text-slate-100">
                      {totalDetail}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
