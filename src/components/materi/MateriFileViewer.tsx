import { FileText, ExternalLink } from "lucide-react";
import { getYouTubeEmbedUrl, guessContentTypeByName, isOwnStorageFile, materiFileViewUrl } from "@/lib/file-types";

function isPreviewableOwnFile(fileName: string): boolean {
  const type = guessContentTypeByName(fileName);
  return type === "text/html" || type === "application/pdf";
}

export default function MateriFileViewer({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName: string | null;
}) {
  const youTubeEmbedUrl = getYouTubeEmbedUrl(fileUrl);

  if (youTubeEmbedUrl) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="aspect-video">
          <iframe
            src={youTubeEmbedUrl}
            title={fileName ?? "Video YouTube"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  const name = fileName ?? "Lampiran";
  const viewUrl = materiFileViewUrl(fileUrl);
  const previewable = isOwnStorageFile(fileUrl) ? isPreviewableOwnFile(name) : true;

  if (previewable) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <iframe src={viewUrl} title={name} className="w-full h-[75vh] bg-white" />
      </div>
    );
  }

  return (
    <a
      href={viewUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
    >
      <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
      <span className="flex-1 min-w-0 truncate text-sm text-slate-700 dark:text-slate-200">{name}</span>
      <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
        Buka di tab baru
        <ExternalLink className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}
