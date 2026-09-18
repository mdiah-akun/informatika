"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SoalJenis, KunciJawaban } from "@/types/soal";
import { Loader2, Clock, ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert, Maximize } from "lucide-react";

const JENIS_LABEL: Record<SoalJenis, string> = { harian: "Soal Harian", sts: "STS", sas: "SAS" };

type SoalTampil = {
  id: string;
  pertanyaan: string;
  gambarUrl: string | null;
  opsi: { label: KunciJawaban; teks: string | null; gambar: string | null }[];
};

type Hasil = { skor: number; jumlahBenar: number; jumlahSoal: number };
type AlasanSelesai = "manual" | "waktu" | "pelanggaran";

function formatWaktu(detik: number): string {
  const m = Math.floor(detik / 60);
  const s = detik % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SoalKerjakanClient({ jenis }: { jenis: SoalJenis }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [soalList, setSoalList] = useState<SoalTampil[]>([]);
  const [jawaban, setJawaban] = useState<Record<string, KunciJawaban>>({});
  const [sisaDetik, setSisaDetik] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [alasanSelesai, setAlasanSelesai] = useState<AlasanSelesai>("manual");
  const [currentIndex, setCurrentIndex] = useState(0);

  const [batasPelanggaran, setBatasPelanggaran] = useState<number | null>(null);
  const [pelanggaran, setPelanggaran] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [pesanPelanggaran, setPesanPelanggaran] = useState<string | null>(null);

  const submittedRef = useRef(false);
  const startedRef = useRef(false);
  const jawabanRef = useRef(jawaban);
  const pelanggaranRef = useRef(0);
  const lastViolationAtRef = useRef(0);

  jawabanRef.current = jawaban;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      const res = await fetch("/api/soal/mulai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Gagal memuat soal.");
        setLoading(false);
        return;
      }
      if (json.done) {
        setHasil({ skor: json.skor, jumlahBenar: json.jumlahBenar, jumlahSoal: json.jumlahSoal });
        setLoading(false);
        return;
      }

      setAttemptId(json.attemptId);
      setSoalList(json.soal);
      setJawaban(json.jawabanTersimpan ?? {});
      setSisaDetik(json.sisaDetik);
      setBatasPelanggaran(json.batasPelanggaran ?? null);
      setPelanggaran(json.jumlahPelanggaranTersimpan ?? 0);
      pelanggaranRef.current = json.jumlahPelanggaranTersimpan ?? 0;
      setLoading(false);
    })();
  }, [jenis]);

  async function handleSubmit(alasan: AlasanSelesai) {
    if (submittedRef.current || !attemptId) return;
    if (alasan === "manual") {
      const belumDijawab = soalList.length - Object.keys(jawabanRef.current).length;
      if (belumDijawab > 0 && !confirm(`Masih ada ${belumDijawab} soal belum dijawab. Kumpulkan jawaban sekarang?`)) {
        return;
      }
    }
    submittedRef.current = true;
    setSubmitting(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    const res = await fetch("/api/soal/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        jawaban: jawabanRef.current,
        final: true,
        jumlahPelanggaran: pelanggaranRef.current,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? "Gagal mengumpulkan jawaban.");
      submittedRef.current = false;
      return;
    }
    setAlasanSelesai(alasan);
    setHasil({ skor: json.skor, jumlahBenar: json.jumlahBenar, jumlahSoal: json.jumlahSoal });
  }

  useEffect(() => {
    if (loading || hasil || !attemptId) return;
    const interval = setInterval(() => {
      setSisaDetik((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit("waktu");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasil, attemptId]);

  // Deteksi anti-nyontek: keluar dari layar penuh atau berpindah tab/aplikasi.
  useEffect(() => {
    if (!examStarted || !batasPelanggaran || hasil) return;

    function catatPelanggaran() {
      const sekarang = Date.now();
      if (sekarang - lastViolationAtRef.current < 1200) return; // dedupe kejadian ganda
      lastViolationAtRef.current = sekarang;

      const next = pelanggaranRef.current + 1;
      pelanggaranRef.current = next;
      setPelanggaran(next);

      fetch("/api/soal/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, jawaban: jawabanRef.current, final: false, jumlahPelanggaran: next }),
      }).catch(() => {});

      if (batasPelanggaran !== null && next > batasPelanggaran) {
        setPesanPelanggaran(null);
        handleSubmit("pelanggaran");
        return;
      }
      setPesanPelanggaran(
        `Pelanggaran terdeteksi (${next}/${batasPelanggaran}): kamu keluar dari layar penuh atau berpindah tab/aplikasi.`
      );
    }

    function onFullscreenChange() {
      if (!document.fullscreenElement) catatPelanggaran();
    }
    function onVisibilityChange() {
      if (document.hidden) catatPelanggaran();
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStarted, batasPelanggaran, hasil, attemptId]);

  async function handleMulaiUjian() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Kalau browser menolak fullscreen, tetap lanjutkan -- deteksi
      // visibilitychange (pindah tab) masih tetap berjalan.
    }
    setExamStarted(true);
  }

  function pilihJawaban(soalId: string, label: KunciJawaban) {
    const updated = { ...jawaban, [soalId]: label };
    setJawaban(updated);
    fetch("/api/soal/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, jawaban: updated, final: false, jumlahPelanggaran: pelanggaranRef.current }),
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md">
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-4 py-3 mb-4">
          {error}
        </p>
        <Link href="/soal" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Soal
        </Link>
      </div>
    );
  }

  if (hasil) {
    return (
      <div className="max-w-md mx-auto text-center py-10">
        <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Jawaban Terkirim</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{JENIS_LABEL[jenis]}</p>
        {alasanSelesai === "waktu" && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">Waktu pengerjaan sudah habis.</p>
        )}
        {alasanSelesai === "pelanggaran" && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-4">
            Jawaban otomatis dikumpulkan karena melebihi batas pelanggaran mode ujian (keluar layar penuh/berpindah
            tab).
          </p>
        )}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6 mt-3">
          <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">{hasil.skor}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {hasil.jumlahBenar} dari {hasil.jumlahSoal} jawaban benar
          </p>
        </div>
        <Link href="/soal" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Soal
        </Link>
      </div>
    );
  }

  if (batasPelanggaran && !examStarted) {
    return (
      <div className="max-w-md mx-auto text-center py-10">
        <div className="h-14 w-14 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Mode Ujian Layar Penuh</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {JENIS_LABEL[jenis]} ini menggunakan mode layar penuh. Jangan keluar dari layar penuh atau berpindah
          tab/aplikasi lain selama mengerjakan. Maksimal <strong>{batasPelanggaran}</strong> kali pelanggaran --
          setelah itu jawaban otomatis dikumpulkan.
        </p>
        <button
          onClick={handleMulaiUjian}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-6 py-2.5 hover:bg-indigo-700"
        >
          <Maximize className="h-4 w-4" />
          Mulai Ujian (Layar Penuh)
        </button>
      </div>
    );
  }

  const soal = soalList[currentIndex];
  const terjawab = Object.keys(jawaban).length;

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 pt-1 pb-3 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{JENIS_LABEL[jenis]}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {terjawab} / {soalList.length} terjawab
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!!batasPelanggaran && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                pelanggaran > 0
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
              title="Jumlah pelanggaran mode ujian"
            >
              <ShieldAlert className="h-4 w-4" />
              {pelanggaran}/{batasPelanggaran}
            </div>
          )}
          <div
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${
              sisaDetik <= 60
                ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatWaktu(sisaDetik)}
          </div>
        </div>
      </div>

      {pesanPelanggaran && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-4 py-2.5">
          <p className="text-sm text-amber-700 dark:text-amber-400">{pesanPelanggaran}</p>
          <button
            onClick={() => setPesanPelanggaran(null)}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
              {currentIndex + 1}. {soal.pertanyaan}
            </p>
            {soal.gambarUrl && (
              <img
                src={soal.gambarUrl}
                alt="Gambar soal"
                className="h-32 mb-3 rounded-md border border-slate-200 dark:border-slate-700 object-contain bg-white"
              />
            )}
            <div className="space-y-2">
              {soal.opsi.map((o) => (
                <label
                  key={o.label}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                    jawaban[soal.id] === o.label
                      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`soal-${soal.id}`}
                    checked={jawaban[soal.id] === o.label}
                    onChange={() => pilihJawaban(soal.id, o.label)}
                    className="accent-indigo-600 shrink-0"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    {o.teks}
                    {o.gambar && (
                      <img src={o.gambar} alt={`Opsi ${o.label}`} className="h-16 mt-1 rounded border border-slate-200 dark:border-slate-700 object-contain bg-white" />
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(soalList.length - 1, i + 1))}
              disabled={currentIndex === soalList.length - 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
            >
              Selanjutnya
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="lg:w-60 shrink-0">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">Nomor Soal</p>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2 mb-4">
              {soalList.map((s, idx) => {
                const sudahDijawab = jawaban[s.id] !== undefined;
                const aktif = idx === currentIndex;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                      aktif ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-800" : ""
                    } ${
                      sudahDijawab
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handleSubmit("manual")}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Kumpulkan Jawaban
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
