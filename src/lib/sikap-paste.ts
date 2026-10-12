export type SikapBaris = { nama: string; poin: number };
export type SikapGagal = { baris: number; teks: string; alasan: string };

const POIN = /^[+-]?\d+$/;
const NOMOR_DEPAN = /^\d+[.)]\s+/;

/** Mengurai teks tempelan (dari Excel atau teks biasa) menjadi pasangan
 *  sikap + poin. Mendukung: kolom dipisah tab (boleh diawali kolom No),
 *  atau satu baris "Nama sikap, 5" / "Nama sikap 5" / "Nama sikap | 5". */
export function parseSikapPaste(teks: string): { ok: SikapBaris[]; gagal: SikapGagal[] } {
  const ok: SikapBaris[] = [];
  const gagal: SikapGagal[] = [];

  const baris = teks.split(/\r?\n/);
  baris.forEach((mentah, i) => {
    const line = mentah.trim();
    if (!line) return;
    const no = i + 1;

    if (ok.length === 0 && gagal.length === 0 && /sikap/i.test(line) && /poin/i.test(line)) return;

    let nama = "";
    let poinStr = "";

    if (line.includes("\t")) {
      let sel = line.split("\t").map((s) => s.trim());
      while (sel.length > 0 && sel[sel.length - 1] === "") sel.pop();
      if (sel.length >= 3 && /^\d+[.)]?$/.test(sel[0])) sel = sel.slice(1);
      if (sel.length < 2) {
        gagal.push({ baris: no, teks: line, alasan: "Poin tidak ditemukan" });
        return;
      }
      poinStr = sel[sel.length - 1];
      nama = sel.slice(0, -1).filter(Boolean).join(" ");
    } else {
      const sisa = line.replace(NOMOR_DEPAN, "");
      const m = sisa.match(/^(.*\S)\s*[,;|]\s*([+-]?\d+)\s*$/) ?? sisa.match(/^(.*\S)\s+([+-]?\d+)\s*$/);
      if (!m) {
        gagal.push({ baris: no, teks: line, alasan: "Poin tidak ditemukan di akhir baris" });
        return;
      }
      nama = m[1].trim();
      poinStr = m[2];
    }

    if (!POIN.test(poinStr)) {
      gagal.push({ baris: no, teks: line, alasan: `Poin "${poinStr}" bukan angka` });
      return;
    }
    if (!nama) {
      gagal.push({ baris: no, teks: line, alasan: "Nama sikap kosong" });
      return;
    }
    ok.push({ nama, poin: Number(poinStr) });
  });

  return { ok, gagal };
}
