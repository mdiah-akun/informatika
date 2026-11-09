// Nama menu dari alamat halaman, untuk kolom "Menu terakhir" di Akses Pengguna.
const DAFTAR: [string, string][] = [
  ["/admin/materi-guru", "Materi Guru"],
  ["/admin/materi", "Kelola Materi"],
  ["/admin/tp", "TP"],
  ["/admin/kisi-kisi", "Kisi-kisi"],
  ["/admin/siswa", "Data Siswa"],
  ["/admin/kelas", "Kelas"],
  ["/admin/users", "Kelola User"],
  ["/admin/akses-pengguna", "Akses Pengguna"],
  ["/admin/jadwal", "Jadwal Pelajaran"],
  ["/admin/ebook", "E-book"],
  ["/admin/jurnal", "Jurnal Mengajar"],
  ["/admin/presensi", "Presensi"],
  ["/admin/lap-presensi", "Lap. Presensi"],
  ["/admin/seting-nilai", "Seting Nilai"],
  ["/admin/catat-nilai-tp", "Catat Nilai TP"],
  ["/admin/nilai-sts", "Nilai STS"],
  ["/admin/nilai-sas", "Nilai SAS"],
  ["/admin/rekap-tp", "Rekap TP"],
  ["/admin/sikap", "Sikap"],
  ["/admin/catat-sikap-positif", "Catat Sikap +"],
  ["/admin/catat-sikap-negatif", "Catat Sikap -"],
  ["/admin/rekap-sikap-positif", "Rekap Sikap +"],
  ["/admin/rekap-sikap-negatif", "Rekap Sikap -"],
  ["/admin/import-sikap", "Import Sikap"],
  ["/admin/soal", "Bank Soal"],
  ["/admin/laporan", "Laporan Ujian"],
  ["/admin/link-ujian", "Link Ujian"],
  ["/materi", "Daftar Materi"],
  ["/tp", "TP"],
  ["/jadwal", "Jadwal Pelajaran"],
  ["/ebook", "E-book"],
  ["/kisi-kisi", "Kisi-kisi"],
  ["/akses-ujian", "Link Ujian"],
  ["/soal", "Soal"],
];

export function menuLabel(path: string | null | undefined): string {
  if (!path) return "-";
  if (path === "/") return "Home";
  const cocok = DAFTAR.filter(([awalan]) => path === awalan || path.startsWith(`${awalan}/`));
  if (cocok.length === 0) return path;
  return cocok.sort((a, b) => b[0].length - a[0].length)[0][1];
}
