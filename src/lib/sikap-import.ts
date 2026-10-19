export type BarisImport = {
  baris: number;
  tanggal: string | null;
  nisn: string;
  nama: string;
  kelas: string;
  sikap: string;
  poin: number | null;
  galat: string | null;
};

const BULAN: Record<string, number> = {
  jan: 1, januari: 1, feb: 2, februari: 2, mar: 3, maret: 3, apr: 4, april: 4,
  mei: 5, may: 5, jun: 6, juni: 6, jul: 7, juli: 7, agu: 8, agt: 8, aug: 8, agustus: 8,
  sep: 9, sept: 9, september: 9, okt: 10, oct: 10, oktober: 10, nov: 11, november: 11,
  des: 12, dec: 12, desember: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

function jadiTanggal(t: number, b: number, y: number): string | null {
  if (y < 100) y += 2000;
  const d = new Date(y, b - 1, t);
  if (d.getFullYear() !== y || d.getMonth() !== b - 1 || d.getDate() !== t) return null;
  return `${y}-${pad(b)}-${pad(t)}`;
}

/** Mengubah "20-Jul-26 17:22:06", "20/07/2026", "2026-07-20", "20 Juli 2026" menjadi YYYY-MM-DD. */
export function parseTanggal(teks: string): string | null {
  const s = teks.trim().split(/\s+\d{1,2}:\d{2}/)[0].trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return jadiTanggal(Number(m[3]), Number(m[2]), Number(m[1]));
  m = s.match(/^(\d{1,2})[-/. ]([A-Za-z]+)[-/. ,]+(\d{2,4})$/);
  if (m) {
    const b = BULAN[m[2].toLowerCase()];
    return b ? jadiTanggal(Number(m[1]), b, Number(m[3])) : null;
  }
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) return jadiTanggal(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

/** Urai tempelan Excel dengan kolom: [No], Tgl.Catat, NISN, Nama, Kelas, Sikap, Poin. */
export function parseImportSikap(teks: string): BarisImport[] {
  const hasil: BarisImport[] = [];
  teks.split(/\r?\n/).forEach((mentah, i) => {
    if (!mentah.trim()) return;
    let sel = mentah.split("\t").map((s) => s.trim());
    while (sel.length > 0 && sel[sel.length - 1] === "") sel.pop();
    if (/nisn/i.test(mentah) && /nama/i.test(mentah) && /poin/i.test(mentah)) return;

    if (sel.length >= 7 && /^\d+[.)]?$/.test(sel[0])) sel = sel.slice(1);
    const baris = i + 1;
    if (sel.length < 6) {
      hasil.push({
        baris, tanggal: null, nisn: "", nama: "", kelas: "", sikap: mentah.trim(), poin: null,
        galat: "Kolom kurang (butuh Tgl.Catat, NISN, Nama, Kelas, Sikap, Poin)",
      });
      return;
    }
    const [tgl, nisn, nama, kelas] = sel;
    const poinStr = sel[sel.length - 1];
    const sikap = sel.slice(4, -1).join(" ");
    const tanggal = parseTanggal(tgl);
    const poin = /^[+-]?\d+$/.test(poinStr) ? Number(poinStr) : null;
    let galat: string | null = null;
    if (!tanggal) galat = `Tanggal "${tgl}" tidak dikenali`;
    else if (!nisn) galat = "NISN kosong";
    else if (!sikap) galat = "Sikap kosong";
    else if (poin === null) galat = `Poin "${poinStr}" bukan angka`;
    hasil.push({ baris, tanggal, nisn, nama, kelas, sikap, poin, galat });
  });
  return hasil;
}
