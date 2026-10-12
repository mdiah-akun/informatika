"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import type { Bab, Kelas } from "@/types/materi";
import type { Siswa } from "@/types/siswa";
import type { TP } from "@/types/tp";
import type { TpNilai, TpNilaiKolom } from "@/types/tp-nilai";
import { Loader2, Search } from "lucide-react";

type SiswaRingkas = Pick<Siswa, "id" | "nisn" | "nama" | "kelas">;
type SemesterFilter = "semua" | "Ganjil" | "Genap";

const ROMAN: Record<Kelas, string> = { 7: "VII", 8: "VIII", 9: "IX" };

function formatAngka(n: number): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

export default function AdminRekapTpClient({
  siswaList,
  babList,
  tpList,
}: {
  siswaList: SiswaRingkas[];
  babList: Bab[];
  tpList: TP[];
}) {
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [rombel, setRombel] = useState("");
  const [semester, setSemester] = useState<SemesterFilter>("semua");
  const [cari, setCari] = useState("");
  const [urutPeringkat, setUrutPeringkat] = useState(false);
  const [kolom, setKolom] = useState<TpNilaiKolom[]>([]);
  const [nilaiRows, setNilaiRows] = useState<Pick<TpNilai, "kolom_id" | "siswa_id" | "nilai">[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rombelOpsi = Array.from(
    new Set(siswaList.map((s) => s.kelas).filter((r) => r.startsWith(`${ROMAN[kelas]}.`)))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const rombelAktif = rombelOpsi.includes(rombel) ? rombel : (rombelOpsi[0] ?? "");

  const babUrutan = new Map(babList.filter((b) => b.kelas === kelas).map((b) => [b.id, b.urutan]));
  const tpKolom = tpList
    .filter((t) => babUrutan.has(t.bab_id) && (semester === "semua" || t.semester === semester))
    .sort((a, b) => (babUrutan.get(a.bab_id)! - babUrutan.get(b.bab_id)!) || a.urutan - b.urutan);

  const siswa = siswaList
    .filter((s) => s.kelas === rombelAktif)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  useEffect(() => {
    if (!rombelAktif) {
      setKolom([]);
      setNilaiRows([]);
      return;
    }
    let batal = false;
    async function muat() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: kolomRows, error: kolomErr } = await supabase
        .from("tp_nilai_kolom")
        .select("*")
        .eq("rombel", rombelAktif);
      if (batal) return;
      if (kolomErr) {
        setLoading(false);
        setError(kolomErr.message);
        setKolom([]);
        setNilaiRows([]);
        return;
      }
      const daftar = (kolomRows ?? []) as TpNilaiKolom[];
      let nilai: Pick<TpNilai, "kolom_id" | "siswa_id" | "nilai">[] = [];
      if (daftar.length > 0) {
        const { data, error } = await supabase
          .from("tp_nilai")
          .select("kolom_id, siswa_id, nilai")
          .in("kolom_id", daftar.map((k) => k.id));
        if (batal) return;
        if (error) {
          setLoading(false);
          setError(error.message);
          return;
        }
        nilai = (data ?? []) as Pick<TpNilai, "kolom_id" | "siswa_id" | "nilai">[];
      }
      setKolom(daftar);
      setNilaiRows(nilai);
      setLoading(false);
    }
    muat();
    return () => {
      batal = true;
    };
  }, [rombelAktif]);

  // Per TP: jumlah nilai tiap siswa dan pembagi (data terbanyak yang terisi
  // pada satu siswa) -- aturan yang sama dengan kolom RATA di Catat Nilai TP.
  const kolomMilikTp = new Map<string, Set<string>>();
  for (const k of kolom) {
    const set = kolomMilikTp.get(k.tp_id) ?? new Set<string>();
    set.add(k.id);
    kolomMilikTp.set(k.tp_id, set);
  }
  const tpIdPerKolom = new Map(kolom.map((k) => [k.id, k.tp_id]));

  const jumlahDanBanyak = new Map<string, Map<string, { jumlah: number; banyak: number }>>();
  for (const r of nilaiRows) {
    const tp = tpIdPerKolom.get(r.kolom_id);
    if (!tp) continue;
    const perSiswa = jumlahDanBanyak.get(tp) ?? new Map();
    const cur = perSiswa.get(r.siswa_id) ?? { jumlah: 0, banyak: 0 };
    cur.jumlah += Number(r.nilai);
    cur.banyak += 1;
    perSiswa.set(r.siswa_id, cur);
    jumlahDanBanyak.set(tp, perSiswa);
  }

  const pembagiPerTp = new Map<string, number>();
  for (const t of tpKolom) {
    const perSiswa = jumlahDanBanyak.get(t.id);
    const idSiswaRombel = new Set(siswa.map((s) => s.id));
    let max = 0;
    perSiswa?.forEach((v, siswaId) => {
      if (idSiswaRombel.has(siswaId) && v.banyak > max) max = v.banyak;
    });
    pembagiPerTp.set(t.id, max);
  }
  const tpBerData = tpKolom.filter((t) => (pembagiPerTp.get(t.id) ?? 0) > 0);

  function nilaiTp(siswaId: string, tpId: string): number | null {
    const pembagi = pembagiPerTp.get(tpId) ?? 0;
    if (pembagi === 0) return null;
    const jumlah = jumlahDanBanyak.get(tpId)?.get(siswaId)?.jumlah ?? 0;
    return jumlah / pembagi;
  }

  const baris = siswa.map((s) => {
    const nilai = tpKolom.map((t) => nilaiTp(s.id, t.id));
    const terisi = nilai.filter((n): n is number => n !== null);
    const rata = terisi.length > 0 ? terisi.reduce((a, b) => a + b, 0) / terisi.length : null;
    return { siswa: s, nilai, rata };
  });

  const peringkat = new Map<string, number>();
  const urut = baris.filter((b) => b.rata !== null).sort((a, b) => (b.rata as number) - (a.rata as number));
  urut.forEach((b, i) => {
    const sebelum = urut[i - 1];
    peringkat.set(
      b.siswa.id,
      sebelum && sebelum.rata === b.rata ? (peringkat.get(sebelum.siswa.id) as number) : i + 1
    );
  });

  const kataCari = cari.trim().toLowerCase();
  const barisTampil = baris
    .filter((b) => !kataCari || b.siswa.nama.toLowerCase().includes(kataCari))
    .sort((a, b) =>
      urutPeringkat
        ? (peringkat.get(a.siswa.id) ?? 9999) - (peringkat.get(b.siswa.id) ?? 9999) ||
          a.siswa.nama.localeCompare(b.siswa.nama)
        : 0
    );

  const th = "border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center font-medium";
  const td = "border border-slate-300 dark:border-slate-600 text-center";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Rekap TP</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Rekap nilai tiap TP per siswa beserta rata-rata dan peringkat di rombelnya. Nilai diisi di menu Catat Nilai
          TP. Menu ini hanya terlihat oleh admin.
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
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value as SemesterFilter)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="semua">Semua semester</option>
            <option value="Ganjil">Semester Ganjil</option>
            <option value="Genap">Semester Genap</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={urutPeringkat}
              onChange={(e) => setUrutPeringkat(e.target.checked)}
              className="h-3.5 w-3.5 accent-indigo-600"
            />
            Urut peringkat
          </label>
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

      {tpKolom.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center text-slate-400 dark:text-slate-500">
          Belum ada TP untuk {kelasLabel(kelas)}
          {semester !== "semua" ? ` semester ${semester}` : ""}. Tambahkan di menu TP.
        </div>
      ) : loading ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : siswa.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center text-slate-400 dark:text-slate-500">
          Belum ada siswa untuk {kelasLabel(kelas)}.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-auto max-h-[72vh] scroll-samar">
          <table className="border-collapse text-sm text-slate-800 dark:text-slate-200">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 dark:bg-slate-700">
                <th className={`${th} sticky left-0 z-30 bg-slate-50 dark:bg-slate-700 w-12`}>No</th>
                <th className={`${th} sticky left-12 z-30 bg-slate-50 dark:bg-slate-700 min-w-[220px]`}>Nama</th>
                {tpKolom.map((t) => (
                  <th
                    key={t.id}
                    title={t.deskripsi}
                    className={`${th} min-w-[56px] ${
                      (pembagiPerTp.get(t.id) ?? 0) === 0 ? "text-slate-400 dark:text-slate-500 font-normal" : ""
                    }`}
                  >
                    {t.kode}
                  </th>
                ))}
                <th className={`${th} min-w-[72px] bg-slate-200 dark:bg-slate-600`}>Rata</th>
                <th className={`${th} min-w-[80px] bg-slate-200 dark:bg-slate-600`}>Peringkat</th>
              </tr>
            </thead>
            <tbody>
              {barisTampil.length === 0 ? (
                <tr>
                  <td colSpan={tpKolom.length + 4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada siswa yang cocok dengan &quot;{cari.trim()}&quot;.
                  </td>
                </tr>
              ) : (
                barisTampil.map((b, i) => (
                  <tr key={b.siswa.id} className="hover:bg-indigo-50 dark:hover:bg-indigo-500/10 group">
                    <td className={`${td} sticky left-0 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400`}>
                      {i + 1}
                    </td>
                    <td className={`${td} sticky left-12 bg-white dark:bg-slate-800 text-left px-2 py-1 font-medium whitespace-nowrap`}>
                      {b.siswa.nama}
                    </td>
                    {b.nilai.map((n, j) => (
                      <td key={tpKolom[j].id} className={`${td} px-2 py-1`}>
                        {n === null ? "" : formatAngka(n)}
                      </td>
                    ))}
                    <td className={`${td} px-2 font-semibold bg-slate-100 dark:bg-slate-700/60`}>
                      {b.rata === null ? "" : formatAngka(b.rata)}
                    </td>
                    <td className={`${td} px-2 font-semibold bg-slate-100 dark:bg-slate-700/60`}>
                      {peringkat.get(b.siswa.id) ?? ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Nilai tiap TP = jumlah nilai siswa dibagi jumlah data terbanyak pada TP itu (sama seperti kolom RATA di Catat
        Nilai TP); siswa yang belum diisi dihitung 0. Kolom TP abu-abu belum punya data dan tidak ikut dihitung.
        Rata = jumlah nilai TP dibagi jumlah TP yang sudah punya data ({tpBerData.length}). Peringkat dihitung di
        dalam rombel (nilai Rata yang sama mendapat peringkat yang sama).
      </p>
    </div>
  );
}
