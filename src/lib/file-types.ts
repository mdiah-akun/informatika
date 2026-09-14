export const EXT_CONTENT_TYPE: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  ico: "image/x-icon",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
};

export function guessContentTypeByName(name: string, fallback?: string): string | undefined {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext && EXT_CONTENT_TYPE[ext]) return EXT_CONTENT_TYPE[ext];
  return fallback || undefined;
}

const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/materi-file/`;

/** True kalau URL ini file yang kita upload sendiri ke Supabase Storage
 *  (bukan link eksternal seperti halaman Vercel atau video YouTube). */
export function isOwnStorageFile(fileUrl: string): boolean {
  return fileUrl.startsWith(STORAGE_PREFIX);
}

/** Link file materi disajikan lewat proxy /api/materi-file/... (bukan URL
 *  publik Supabase langsung) supaya Content-Type-nya benar -- Supabase
 *  sengaja memaksa file text/html publik jadi text/plain (proteksi
 *  anti stored-XSS di domain mereka), jadi dibuka langsung akan
 *  menampilkan tag mentah alih-alih me-render-nya. Link eksternal
 *  dibiarkan apa adanya. */
export function materiFileViewUrl(fileUrl: string): string {
  if (isOwnStorageFile(fileUrl)) {
    return `/api/materi-file/${fileUrl.slice(STORAGE_PREFIX.length)}`;
  }
  return fileUrl;
}

/** Kalau url berupa link video YouTube (watch/youtu.be/shorts/embed),
 *  kembalikan URL embed-nya. Selain itu null. */
export function getYouTubeEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "youtube.com") {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    const match = parsed.pathname.match(/^\/(embed|shorts)\/([^/]+)/);
    if (match) return `https://www.youtube.com/embed/${match[2]}`;
  }

  return null;
}
