/** Hash string sederhana (FNV-1a) -- dipakai sebagai kunci pengurutan
 *  acak yang deterministik (bukan untuk keamanan). */
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Acak urutan array secara deterministik berdasarkan seedPrefix + kunci
 *  tiap item, supaya urutan tetap sama tiap kali dipanggil ulang dengan
 *  seed yang sama (mis. saat siswa refresh halaman di tengah pengerjaan). */
export function seededShuffle<T>(items: T[], seedPrefix: string, keyOf: (item: T) => string): T[] {
  return items
    .map((item) => ({ item, key: hashSeed(`${seedPrefix}:${keyOf(item)}`) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.item);
}
