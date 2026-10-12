"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import type { Sikap, SikapCatatan, SikapJenis } from "@/types/sikap";
import type { Siswa } from "@/types/siswa";
import type { Kelas } from "@/types/materi";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";

type SiswaRingkas = Pick<Siswa, "id" | "nisn" | "nama" | "kelas">;

const ROMAN: Record<Kelas, string> = { 7: "VII", 8: "VIII", 9: "IX" };

function hariIni(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTanggal(tgl: string): string {
  return new Date(`${tgl}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCatatSikapClient({
  jenis,
  siswaList,
  sikapList,
}: {
  jenis: SikapJenis;
  siswaList: SiswaRingkas[];
  sikapList: Sikap[];
}) {
  const positif = jenis === "positif";
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [rombel, setRombel] = useState("");
  const [tanggal, setTanggal] = useState(hariIni());
  const [dicentang, setDicentang] = useState<string[]>([]);
  const [fokus, setFokus] = useState<string | null>(null);
  const [cari, setCari] = useState("");
  const [catatan, setCatatan] = useState<SikapCatatan[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rombelOpsi = Array.from(
    new Set(siswaList.map((s) => s.kelas).filter((r) => r.startsWith(`${ROMAN[kelas]}.`)))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const rombelAktif = rombelOpsi.includes(rombel) ? rombel : (rombelOpsi[0] ?? "");
  const siswa = siswaList
    .filter((s) => s.kelas === rombelAktif)
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const kataCari = cari.trim().toLowerCase();
  const sikapTampil = kataCari ? sikapList.filter((s) => s.nama.toLowerCase().includes(kataCari)) : sikapList;
  const idRombel = new Set(siswa.map((s) => s.id));
  const centangAktif = dicentang.filter((id) => idRombel.has(id));
  const semuaDicentang = siswa.length > 0 && centangAktif.length === siswa.length;
  const siswaFokus = siswa.find((s) => s.id === fokus) ?? null;

  function toggleSiswa(id: string) {
    setDicentang((prev) => {
      if (prev.includes(id)) {
        const sisa = prev.filter((x) => x !== id);
        if (fokus === id) setFokus(sisa[sisa.length - 1] ?? null);
        return sisa;
      }
      setFokus(id);
      return [...prev, id];
    });
  }

  function toggleSemua() {
    if (semuaDicentang) {
      setDicentang([]);
      setFokus(null);
    } else {
      setDicentang(siswa.map((s) => s.id));
      setFokus(siswa[0]?.id ?? null);
    }
  }

  useEffect(() => {
    setDicentang([]);
    setFokus(null);
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
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false });
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
  const riwayat = catatan.filter((c) => c.siswa_id === fokus);

  async function catat(s: Sikap) {
    if (centangAktif.length === 0) return;
    if (
      centangAktif.length > 1 &&
      !confirm(`Catat "${s.nama}" (${s.poin} poin) untuk ${centangAktif.length} siswa yang dicentang?`)
    ) {
      return;
    }
    setBusyKey(s.id);
    setError(null);
    const supabase = createClient();
    const rows = centangAktif.map((siswaId) => ({
      siswa_id: siswaId,
      sikap_id: s.id,
      jenis,
      nama: s.nama,
      poin: s.poin,
      tanggal,
    }));
    const { data, error } = await supabase.from("sikap_catatan").insert(rows).select();
    setBusyKey(null);
    if (error || !data) {
      setError(error?.message ?? "Gagal mencatat sikap.");
      return;
    }
    setCatatan((prev) => [...(data as SikapCatatan[]), ...prev]);
  }

  async function hapus(c: SikapCatatan) {
    if (!confirm(`Hapus catatan "${c.nama}" (${formatTanggal(c.tanggal)})?`)) return;
    setBusyKey(c.id);
    const supabase = createClient();
    const { error } = await supabase.from("sikap_catatan").delete().eq("id", c.id);
    setBusyKey(null);
    if (error) {
      setError(error.message);
      return;
    }
    setCatatan((prev) => prev.filter((x) => x.id !== c.id));
  }

  const th = "px-2 py-1.5 font-medium text-left";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Catat Sikap {positif ? "+" : "-"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Centang satu atau beberapa siswa di kiri, lalu klik tombol + pada sikap {positif ? "positif" : "negatif"} di kanan untuk
          mencatatnya. Daftar sikap diatur di menu Sikap. Menu ini hanya terlihat oleh admin.
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
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          Tanggal
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        {centangAktif.length > 0 ? (
          <span className="text-sm text-indigo-700 dark:text-indigo-300">
            <span className="font-semibold">{centangAktif.length}</span> siswa dicentang
          </span>
        ) : (
          <span className="text-sm text-amber-600 dark:text-amber-400">Centang siswa di kiri dulu</span>
        )}
        </div>

        <div className="relative w-full sm:w-48 sm:ml-auto py-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari catatan nilai sikap..."
            title="Cari catatan nilai sikap"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 pl-9 pr-2 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-auto max-h-[60vh] scroll-samar">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className={`${th} w-8`}>
                    <input
                      type="checkbox"
                      checked={semuaDicentang}
                      onChange={toggleSemua}
                      disabled={siswa.length === 0}
                      title="Pilih semua"
                      className="h-3.5 w-3.5 cursor-pointer accent-indigo-600"
                    />
                  </th>
                  <th className={`${th} w-10`}>No</th>
                  <th className={`${th} w-28`}>NISN</th>
                  <th className={th}>Nama Siswa</th>
                  <th className={`${th} w-14 text-right`}>Poin</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400 mx-auto" />
                    </td>
                  </tr>
                ) : siswa.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                      Belum ada siswa untuk {kelasLabel(kelas)}.
                    </td>
                  </tr>
                ) : (
                  siswa.map((s, i) => (
                    <tr
                      key={s.id}
                      onClick={() => toggleSiswa(s.id)}
                      className={`cursor-pointer border-b border-slate-100 dark:border-slate-700/60 last:border-0 ${
                        centangAktif.includes(s.id)
                          ? "bg-indigo-100 dark:bg-indigo-500/25"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={centangAktif.includes(s.id)}
                          onChange={() => toggleSiswa(s.id)}
                          className="h-3.5 w-3.5 cursor-pointer accent-indigo-600"
                        />
                      </td>
                      <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{i + 1}</td>
                      <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{s.nisn ?? "-"}</td>
                      <td className="px-2 py-1 font-medium text-slate-800 dark:text-slate-200">{s.nama}</td>
                      <td className="px-2 py-1 text-right font-semibold text-slate-700 dark:text-slate-200">
                        {totalPerSiswa.get(s.id) ?? ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-auto max-h-[60vh] scroll-samar">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className={`${th} w-10`}>No</th>
                  <th className={th}>Catatan Nilai Sikap</th>
                  <th className={`${th} w-14 text-right`}>Poin</th>
                  <th className={`${th} w-12 text-center`}>Catat</th>
                </tr>
              </thead>
              <tbody>
                {sikapTampil.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                      {sikapList.length === 0
                        ? `Belum ada sikap ${positif ? "positif" : "negatif"}. Isi dulu di menu Sikap.`
                        : `Tidak ada sikap yang cocok dengan "${cari.trim()}".`}
                    </td>
                  </tr>
                ) : (
                  sikapTampil.map((s, i) => (
                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                      <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{i + 1}</td>
                      <td className="px-2 py-1 text-slate-800 dark:text-slate-200">{s.nama}</td>
                      <td className="px-2 py-1 text-right font-semibold text-slate-700 dark:text-slate-200">{s.poin}</td>
                      <td className="px-2 py-1 text-center">
                        <button
                          onClick={() => catat(s)}
                          disabled={centangAktif.length === 0 || busyKey === s.id}
                          title={
                            centangAktif.length === 0
                              ? "Centang siswa dulu"
                              : centangAktif.length === 1
                                ? `Catat untuk ${siswaFokus?.nama ?? "siswa terpilih"}`
                                : `Catat untuk ${centangAktif.length} siswa`
                          }
                          className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white p-1 hover:bg-indigo-700 disabled:opacity-30 disabled:hover:bg-indigo-600"
                        >
                          {busyKey === s.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {siswaFokus && (
        <div className="mt-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Riwayat {siswaFokus.nama}
            </h2>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Total poin: <span className="font-semibold">{totalPerSiswa.get(siswaFokus.id) ?? 0}</span>
            </span>
          </div>
          <div className="overflow-auto max-h-64 scroll-samar">
            <table className="w-full text-[13px]">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className={`${th} w-28`}>Tanggal</th>
                  <th className={th}>Sikap</th>
                  <th className={`${th} w-14 text-right`}>Poin</th>
                  <th className={`${th} w-12`} />
                </tr>
              </thead>
              <tbody>
                {riwayat.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                      Belum ada catatan untuk siswa ini.
                    </td>
                  </tr>
                ) : (
                  riwayat.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                      <td className="px-2 py-1 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatTanggal(c.tanggal)}
                      </td>
                      <td className="px-2 py-1 text-slate-800 dark:text-slate-200">{c.nama}</td>
                      <td className="px-2 py-1 text-right font-semibold text-slate-700 dark:text-slate-200">{c.poin}</td>
                      <td className="px-2 py-1 text-center">
                        <button
                          onClick={() => hapus(c)}
                          disabled={busyKey === c.id}
                          title="Hapus catatan"
                          className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                        >
                          {busyKey === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
