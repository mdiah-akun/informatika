export type SoalParsed = {
  nomor: string;
  pertanyaan: string;
  opsi: { A: string; B: string; C: string; D: string };
  lengkap: boolean;
};

/** Ekstrak soal pilihan ganda dari teks hasil PDF (atau teks tempel manual).
 *  Format yang didukung: nomor soal diawali "1.", "2.", dst di awal baris,
 *  lalu opsi jawaban "A." "B." "C." "D." -- baik masing-masing di baris
 *  sendiri, dua opsi per baris (layout kolom), maupun semua dalam satu
 *  baris. Urutan fisik opsi di teks tidak harus A-B-C-D. */
export function parseSoalFromText(text: string): SoalParsed[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const qRegex = /(?:^|\n)\s*(\d{1,3})\.\s+/g;
  const matches: { index: number; end: number; num: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = qRegex.exec(normalized))) {
    matches.push({ index: m.index, end: qRegex.lastIndex, num: m[1] });
  }

  const results: SoalParsed[] = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].end;
    const stop = i + 1 < matches.length ? matches[i + 1].index : normalized.length;
    const block = normalized.slice(start, stop);

    const optRegex = /\b([ABCD])\.\s+/g;
    const optMatches: { label: "A" | "B" | "C" | "D"; start: number; contentStart: number }[] = [];
    let om: RegExpExecArray | null;
    while ((om = optRegex.exec(block))) {
      optMatches.push({ label: om[1] as "A" | "B" | "C" | "D", start: om.index, contentStart: optRegex.lastIndex });
    }
    if (optMatches.length === 0) continue;

    const pertanyaan = block.slice(0, optMatches[0].start).replace(/\s+/g, " ").trim();
    const opsi: Record<string, string> = { A: "", B: "", C: "", D: "" };
    for (let j = 0; j < optMatches.length; j++) {
      const end = j + 1 < optMatches.length ? optMatches[j + 1].start : block.length;
      opsi[optMatches[j].label] = block.slice(optMatches[j].contentStart, end).replace(/\s+/g, " ").trim();
    }

    const lengkap = !!(pertanyaan && opsi.A && opsi.B && opsi.C && opsi.D);
    results.push({ nomor: matches[i].num, pertanyaan, opsi: opsi as SoalParsed["opsi"], lengkap });
  }

  return results;
}
