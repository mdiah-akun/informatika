"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react";

/** Editor teks kaya sederhana berbasis contentEditable -- cukup untuk
 *  soal essai (bold/italic/underline/list), tanpa perlu library berat. */
export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string) {
    document.execCommand(command);
    ref.current?.focus();
    onChange(ref.current?.innerHTML ?? "");
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    // Tempel sebagai teks polos saja -- paste dari Word/aplikasi lain
    // biasanya membawa banyak markup tersembunyi (mso-*, span berlapis,
    // dll) yang bikin tampilan berantakan. Format (tebal/miring/dst)
    // tetap bisa ditambahkan manual lewat toolbar setelah tempel.
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    onChange(ref.current?.innerHTML ?? "");
  }

  const buttonClass =
    "p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600";

  return (
    <div className="rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden">
      <div className="flex items-center gap-0.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-1">
        <button type="button" onClick={() => exec("bold")} className={buttonClass} title="Tebal">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => exec("italic")} className={buttonClass} title="Miring">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => exec("underline")} className={buttonClass} title="Garis Bawah">
          <Underline className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className={buttonClass}
          title="Daftar Poin"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className={buttonClass}
          title="Daftar Nomor"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="min-h-[100px] px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-slate-500"
      />
    </div>
  );
}
