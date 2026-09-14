import type { JadwalPelajaran } from "@/types/jadwal";
import { CalendarDays } from "lucide-react";

export default function JadwalClient({ jadwal }: { jadwal: JadwalPelajaran | null }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Jadwal Pelajaran</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Berlaku untuk semua kelas</p>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        {jadwal?.gambar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={jadwal.gambar_url} alt="Jadwal Pelajaran" className="max-w-full rounded-lg mx-auto" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-slate-400 dark:text-slate-500">
            <CalendarDays className="h-8 w-8" />
            Jadwal pelajaran belum tersedia.
          </div>
        )}
      </div>
    </div>
  );
}
