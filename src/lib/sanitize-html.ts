import DOMPurify from "isomorphic-dompurify";

/** Untuk konten yang ditulis lewat RichTextEditor (bold/italic/underline/
 *  list) sebelum ditampilkan lewat dangerouslySetInnerHTML -- soal essai
 *  disimpan sebagai HTML mentah, jadi wajib disaring dulu di sisi render
 *  supaya tidak ada celah stored XSS kalau isinya pernah berisi HTML
 *  berbahaya (mis. dari sesi admin yang dibajak). */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "ul", "ol", "li", "br", "div", "p", "span"],
    ALLOWED_ATTR: [],
  });
}
