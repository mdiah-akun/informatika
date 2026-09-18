"use client";

import { useState, useEffect } from "react";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import { TP_LIST } from "@/lib/soal-tp";
import { JENIS_LIST } from "@/lib/soal-jenis";
import type { Soal, SoalJenis, KunciJawaban, SoalPengaturan } from "@/types/soal";
import type { SoalEssai, SoalEssaiPengaturan } from "@/types/soal-essai";
import type { Kelas } from "@/types/materi";
import SoalImportModal from "@/components/SoalImportModal";
import RichTextEditor from "@/components/RichTextEditor";
import { Plus, Pencil, Trash2, Loader2, X, Check, ImageIcon, Upload, Shuffle, CalendarClock, ShieldAlert } from "lucide-react";

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const OPSI_LABELS: KunciJawaban[] = ["A", "B", "C", "D"];
const TIPE_SOAL_LIST: { value: "pilihan_ganda" | "essai"; label: string }[] = [
  { value: "pilihan_ganda", label: "Pilihan Ganda" },
  { value: "essai", label: "Essai" },
];

type OpsiState = { teks: string; gambar: string | null };

function ImageUploadBox({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErr("File harus berupa gambar.");
      return;
    }
    setUploading(true);
    setErr(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("soal-gambar").upload(path, file, { contentType: file.type });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("soal-gambar").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal mengunggah gambar.");
    }
    setUploading(false);
  }

  return (
    <div>
      {url ? (
        <div className="relative inline-block">
          <img
            src={url}
            alt={label}
            className="h-20 rounded-md border border-slate-300 dark:border-slate-600 object-contain bg-white dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 rounded-md px-2.5 py-1.5 cursor-pointer hover:border-indigo-400">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          {uploading ? "Mengunggah..." : label}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {err && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{err}</p>}
    </div>
  );
}

function LabelTpSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
        Label Soal (dari TP mana)
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
      >
        <option value="">Umum (tidak spesifik TP)</option>
        {TP_LIST.map((tp) => (
          <option key={tp} value={tp}>
            {tp}
          </option>
        ))}
      </select>
    </div>
  );
}

function SoalForm({
  kelas,
  jenis,
  existingCount,
  initial,
  onCancel,
  onSaved,
}: {
  kelas: Kelas;
  jenis: SoalJenis;
  existingCount: number;
  initial?: Soal;
  onCancel: () => void;
  onSaved: (item: Soal) => void;
}) {
  const [labelTp, setLabelTp] = useState(initial?.label_tp ?? "");
  const [pertanyaan, setPertanyaan] = useState(initial?.pertanyaan ?? "");
  const [gambarSoal, setGambarSoal] = useState<string | null>(initial?.gambar_soal_url ?? null);
  const [opsi, setOpsi] = useState<Record<KunciJawaban, OpsiState>>({
    A: { teks: initial?.opsi_a ?? "", gambar: initial?.opsi_a_gambar_url ?? null },
    B: { teks: initial?.opsi_b ?? "", gambar: initial?.opsi_b_gambar_url ?? null },
    C: { teks: initial?.opsi_c ?? "", gambar: initial?.opsi_c_gambar_url ?? null },
    D: { teks: initial?.opsi_d ?? "", gambar: initial?.opsi_d_gambar_url ?? null },
  });
  const [kunci, setKunci] = useState<KunciJawaban>(initial?.kunci_jawaban ?? "A");
  const [urutan, setUrutan] = useState(initial?.urutan ?? existingCount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateOpsi(label: KunciJawaban, patch: Partial<OpsiState>) {
    setOpsi((prev) => ({ ...prev, [label]: { ...prev[label], ...patch } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pertanyaan.trim()) {
      setError("Pertanyaan wajib diisi.");
      return;
    }
    for (const label of OPSI_LABELS) {
      if (!opsi[label].teks.trim() && !opsi[label].gambar) {
        setError(`Opsi ${label} wajib diisi teks atau gambar.`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      kelas,
      jenis,
      label_tp: labelTp || null,
      pertanyaan,
      gambar_soal_url: gambarSoal,
      opsi_a: opsi.A.teks || null,
      opsi_a_gambar_url: opsi.A.gambar,
      opsi_b: opsi.B.teks || null,
      opsi_b_gambar_url: opsi.B.gambar,
      opsi_c: opsi.C.teks || null,
      opsi_c_gambar_url: opsi.C.gambar,
      opsi_d: opsi.D.teks || null,
      opsi_d_gambar_url: opsi.D.gambar,
      kunci_jawaban: kunci,
      urutan,
    };

    const query = initial
      ? supabase.from("soal").update(payload).eq("id", initial.id).select().single()
      : supabase.from("soal").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan soal.");
      return;
    }
    onSaved(data as Soal);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
    >
      <LabelTpSelect value={labelTp} onChange={setLabelTp} />

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Pertanyaan</label>
        <textarea
          autoFocus
          rows={3}
          value={pertanyaan}
          onChange={(e) => setPertanyaan(e.target.value)}
          placeholder="Tulis pertanyaan di sini..."
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
        <div className="mt-2">
          <ImageUploadBox label="Gambar soal (opsional)" url={gambarSoal} onChange={setGambarSoal} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPSI_LABELS.map((label) => (
          <div key={label} className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              <input
                type="radio"
                name="kunci_jawaban"
                checked={kunci === label}
                onChange={() => setKunci(label)}
                className="accent-indigo-600"
              />
              Opsi {label}
              {kunci === label && (
                <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">Kunci Jawaban</span>
              )}
            </label>
            <input
              value={opsi[label].teks}
              onChange={(e) => updateOpsi(label, { teks: e.target.value })}
              placeholder={`Teks jawaban ${label}`}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm mb-2"
            />
            <ImageUploadBox
              label="Gambar (opsional)"
              url={opsi[label].gambar}
              onChange={(url) => updateOpsi(label, { gambar: url })}
            />
          </div>
        ))}
      </div>

      <div className="max-w-[140px]">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Urutan</label>
        <input
          type="number"
          value={urutan}
          onChange={(e) => setUrutan(Number(e.target.value))}
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm px-3 py-1.5 text-slate-600 dark:text-slate-300"
        >
          <X className="h-3.5 w-3.5" />
          Batal
        </button>
      </div>
    </form>
  );
}

function SoalEssaiForm({
  kelas,
  jenis,
  existingCount,
  initial,
  onCancel,
  onSaved,
}: {
  kelas: Kelas;
  jenis: SoalJenis;
  existingCount: number;
  initial?: SoalEssai;
  onCancel: () => void;
  onSaved: (item: SoalEssai) => void;
}) {
  const [labelTp, setLabelTp] = useState(initial?.label_tp ?? "");
  const [pertanyaan, setPertanyaan] = useState(initial?.pertanyaan ?? "");
  const [gambarSoal, setGambarSoal] = useState<string | null>(initial?.gambar_soal_url ?? null);
  const [kunciJawaban, setKunciJawaban] = useState(initial?.kunci_jawaban ?? "");
  const [skorMaksimal, setSkorMaksimal] = useState(initial?.skor_maksimal ?? 100);
  const [urutan, setUrutan] = useState(initial?.urutan ?? existingCount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pertanyaan.trim()) {
      setError("Pertanyaan wajib diisi.");
      return;
    }
    if (!kunciJawaban.trim()) {
      setError("Kunci jawaban wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      kelas,
      jenis,
      label_tp: labelTp || null,
      pertanyaan,
      gambar_soal_url: gambarSoal,
      kunci_jawaban: kunciJawaban,
      skor_maksimal: skorMaksimal,
      urutan,
    };

    const query = initial
      ? supabase.from("soal_essai").update(payload).eq("id", initial.id).select().single()
      : supabase.from("soal_essai").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan soal essai.");
      return;
    }
    onSaved(data as SoalEssai);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
    >
      <LabelTpSelect value={labelTp} onChange={setLabelTp} />

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Pertanyaan</label>
        <RichTextEditor value={pertanyaan} onChange={setPertanyaan} placeholder="Tulis pertanyaan essai di sini..." />
        <div className="mt-2">
          <ImageUploadBox label="Gambar soal (opsional)" url={gambarSoal} onChange={setGambarSoal} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Kunci Jawaban</label>
        <RichTextEditor
          value={kunciJawaban}
          onChange={setKunciJawaban}
          placeholder="Tulis kunci jawaban / jawaban model di sini..."
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="max-w-[140px]">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Skor Maksimal</label>
          <input
            type="number"
            min={1}
            value={skorMaksimal}
            onChange={(e) => setSkorMaksimal(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="max-w-[140px]">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Urutan</label>
          <input
            type="number"
            value={urutan}
            onChange={(e) => setUrutan(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm px-3 py-1.5 text-slate-600 dark:text-slate-300"
        >
          <X className="h-3.5 w-3.5" />
          Batal
        </button>
      </div>
    </form>
  );
}

function OpsiPreview({ label, opsi, isKunci }: { label: KunciJawaban; opsi: OpsiState; isKunci: boolean }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
        isKunci
          ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <span className={`font-semibold shrink-0 ${isKunci ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
        {label}.
      </span>
      <div className="min-w-0 flex-1">
        {opsi.teks && <span className="text-slate-700 dark:text-slate-200">{opsi.teks}</span>}
        {opsi.gambar && (
          <img src={opsi.gambar} alt={`Opsi ${label}`} className="h-12 mt-1 rounded border border-slate-200 dark:border-slate-700 object-contain bg-white" />
        )}
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors shrink-0 ${
          checked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
    </label>
  );
}

function SkorInput({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  function commit() {
    const v = Math.max(1, Number(text) || 1);
    setText(String(v));
    if (v !== value) onSave(v);
  }

  return (
    <input
      type="number"
      min={1}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className="w-16 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
    />
  );
}

export default function AdminSoalClient({
  soalAwal,
  soalEssaiAwal,
  pengaturanAwal,
  pengaturanEssaiAwal,
}: {
  soalAwal: Soal[];
  soalEssaiAwal: SoalEssai[];
  pengaturanAwal: SoalPengaturan[];
  pengaturanEssaiAwal: SoalEssaiPengaturan[];
}) {
  const [soalList, setSoalList] = useState<Soal[]>(soalAwal);
  const [soalEssaiList, setSoalEssaiList] = useState<SoalEssai[]>(soalEssaiAwal);
  const [pengaturanList, setPengaturanList] = useState<SoalPengaturan[]>(pengaturanAwal);
  const [pengaturanEssaiList, setPengaturanEssaiList] = useState<SoalEssaiPengaturan[]>(pengaturanEssaiAwal);
  const [tipeAktif, setTipeAktif] = useState<"pilihan_ganda" | "essai">("pilihan_ganda");
  const [jenis, setJenis] = useState<SoalJenis>("harian");
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [tpFilter, setTpFilter] = useState<string>("semua");
  const [formFor, setFormFor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [savingPengaturan, setSavingPengaturan] = useState(false);

  const items = soalList
    .filter((s) => s.jenis === jenis && s.kelas === kelas)
    .filter((s) => tpFilter === "semua" || s.label_tp === tpFilter)
    .sort((a, b) => a.urutan - b.urutan);

  const itemsEssai = soalEssaiList
    .filter((s) => s.jenis === jenis && s.kelas === kelas)
    .filter((s) => tpFilter === "semua" || s.label_tp === tpFilter)
    .sort((a, b) => a.urutan - b.urutan);

  const pengaturan = pengaturanList.find((p) => p.kelas === kelas && p.jenis === jenis);

  async function handleUpdatePengaturan(
    patch: Partial<
      Pick<SoalPengaturan, "acak_soal" | "acak_opsi" | "mulai_at" | "selesai_at" | "durasi_menit" | "batas_pelanggaran">
    >
  ) {
    setSavingPengaturan(true);
    const supabase = createClient();
    const payload = {
      kelas,
      jenis,
      acak_soal: pengaturan?.acak_soal ?? false,
      acak_opsi: pengaturan?.acak_opsi ?? false,
      mulai_at: pengaturan?.mulai_at ?? null,
      selesai_at: pengaturan?.selesai_at ?? null,
      durasi_menit: pengaturan?.durasi_menit ?? 60,
      batas_pelanggaran: pengaturan?.batas_pelanggaran ?? null,
      ...patch,
    };
    const { data, error } = await supabase
      .from("soal_pengaturan")
      .upsert(payload, { onConflict: "kelas,jenis" })
      .select()
      .single();
    setSavingPengaturan(false);
    if (error || !data) {
      alert(error?.message ?? "Gagal menyimpan pengaturan.");
      return;
    }
    setPengaturanList((prev) => {
      const rest = prev.filter((p) => !(p.kelas === kelas && p.jenis === jenis));
      return [...rest, data as SoalPengaturan];
    });
  }

  const pengaturanEssai = pengaturanEssaiList.find((p) => p.kelas === kelas && p.jenis === jenis);

  async function handleUpdatePengaturanEssai(
    patch: Partial<Pick<SoalEssaiPengaturan, "mulai_at" | "selesai_at" | "durasi_menit" | "batas_pelanggaran">>
  ) {
    setSavingPengaturan(true);
    const supabase = createClient();
    const payload = {
      kelas,
      jenis,
      mulai_at: pengaturanEssai?.mulai_at ?? null,
      selesai_at: pengaturanEssai?.selesai_at ?? null,
      durasi_menit: pengaturanEssai?.durasi_menit ?? 60,
      batas_pelanggaran: pengaturanEssai?.batas_pelanggaran ?? null,
      ...patch,
    };
    const { data, error } = await supabase
      .from("soal_essai_pengaturan")
      .upsert(payload, { onConflict: "kelas,jenis" })
      .select()
      .single();
    setSavingPengaturan(false);
    if (error || !data) {
      alert(error?.message ?? "Gagal menyimpan pengaturan.");
      return;
    }
    setPengaturanEssaiList((prev) => {
      const rest = prev.filter((p) => !(p.kelas === kelas && p.jenis === jenis));
      return [...rest, data as SoalEssaiPengaturan];
    });
  }

  async function handleDelete(item: Soal) {
    if (!confirm("Hapus soal ini?")) return;
    setBusyId(item.id);
    const supabase = createClient();
    const { error } = await supabase.from("soal").delete().eq("id", item.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setSoalList((prev) => prev.filter((s) => s.id !== item.id));
  }

  async function handleDeleteEssai(item: SoalEssai) {
    if (!confirm("Hapus soal essai ini?")) return;
    setBusyId(item.id);
    const supabase = createClient();
    const { error } = await supabase.from("soal_essai").delete().eq("id", item.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setSoalEssaiList((prev) => prev.filter((s) => s.id !== item.id));
  }

  async function handleUpdateSkorMaksimal(item: SoalEssai, skorMaksimal: number) {
    setSoalEssaiList((prev) => prev.map((s) => (s.id === item.id ? { ...s, skor_maksimal: skorMaksimal } : s)));
    try {
      const supabase = createClient();
      const result = await supabase.from("soal_essai").update({ skor_maksimal: skorMaksimal }).eq("id", item.id);
      if (result.error) {
        alert(result.error.message);
        setSoalEssaiList((prev) => prev.map((s) => (s.id === item.id ? { ...s, skor_maksimal: item.skor_maksimal } : s)));
      }
    } catch {
      alert("Gagal menyimpan skor. Coba lagi.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Bank Soal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola soal pilihan ganda dan essai untuk soal harian, STS, dan SAS
          </p>
        </div>
        {tipeAktif === "pilihan_ganda" && (
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Upload className="h-4 w-4" />
            Import Soal
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        {TIPE_SOAL_LIST.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTipeAktif(t.value);
              setFormFor(null);
            }}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tipeAktif === t.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-3">
        {JENIS_LIST.map((j) => (
          <button
            key={j.value}
            onClick={() => {
              setJenis(j.value);
              setFormFor(null);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              jenis === j.value
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {j.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          {KELAS_LIST.map((k) => (
            <button
              key={k}
              onClick={() => {
                setKelas(k);
                setTpFilter("semua");
                setFormFor(null);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                kelas === k
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {kelasLabel(k)}
            </button>
          ))}
        </div>

        <select
          value={tpFilter}
          onChange={(e) => setTpFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        >
          <option value="semua">Semua Label TP</option>
          {TP_LIST.map((tp) => (
            <option key={tp} value={tp}>
              {tp}
            </option>
          ))}
        </select>
      </div>

      {tipeAktif === "pilihan_ganda" && (
        <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Pengaturan {kelasLabel(kelas)} &middot; {JENIS_LIST.find((j) => j.value === jenis)?.label}
            {savingPengaturan && <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 shrink-0">
              <Shuffle className="h-3.5 w-3.5" />
            </div>
            <ToggleSwitch
              checked={pengaturan?.acak_soal ?? false}
              onChange={(v) => handleUpdatePengaturan({ acak_soal: v })}
              label="Acak Urutan Soal"
            />
            <ToggleSwitch
              checked={pengaturan?.acak_opsi ?? false}
              onChange={(v) => handleUpdatePengaturan({ acak_opsi: v })}
              label="Acak Urutan Opsi Jawaban"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 shrink-0">
              <CalendarClock className="h-3.5 w-3.5" />
              Tayang soal:
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-400">Dari</label>
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(pengaturan?.mulai_at ?? null)}
                onChange={(e) => handleUpdatePengaturan({ mulai_at: fromDatetimeLocalValue(e.target.value) })}
                className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-400">Sampai</label>
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(pengaturan?.selesai_at ?? null)}
                onChange={(e) => handleUpdatePengaturan({ selesai_at: fromDatetimeLocalValue(e.target.value) })}
                className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            {(pengaturan?.mulai_at || pengaturan?.selesai_at) && (
              <button
                onClick={() => handleUpdatePengaturan({ mulai_at: null, selesai_at: null })}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 underline"
              >
                Hapus jadwal
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-400">Durasi pengerjaan (menit)</label>
              <input
                type="number"
                min={1}
                value={pengaturan?.durasi_menit ?? 60}
                onChange={(e) => handleUpdatePengaturan({ durasi_menit: Math.max(1, Number(e.target.value)) })}
                className="w-20 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <label className="text-xs text-slate-500 dark:text-slate-400">
                Batas pelanggaran (keluar layar penuh/pindah tab)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Nonaktif"
                value={pengaturan?.batas_pelanggaran ?? ""}
                onChange={(e) =>
                  handleUpdatePengaturan({
                    batas_pelanggaran: e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-24 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Kosongkan tanggal untuk tanpa batas waktu tayang. Waktu memakai zona waktu perangkat Anda. Timer
            pengerjaan mulai berjalan sejak siswa menekan tombol &quot;Mulai Kerjakan&quot;. Kosongkan batas
            pelanggaran untuk menonaktifkan mode layar penuh wajib -- kalau diisi, siswa wajib mengerjakan dalam
            layar penuh dan keluar dari layar penuh/pindah tab dihitung pelanggaran; melebihi batas akan otomatis
            mengumpulkan jawaban.
          </p>
        </div>
      )}

      {tipeAktif === "essai" && (
        <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Pengaturan {kelasLabel(kelas)} &middot; {JENIS_LIST.find((j) => j.value === jenis)?.label}
            {savingPengaturan && <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 shrink-0">
              <CalendarClock className="h-3.5 w-3.5" />
              Tayang soal:
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-400">Dari</label>
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(pengaturanEssai?.mulai_at ?? null)}
                onChange={(e) => handleUpdatePengaturanEssai({ mulai_at: fromDatetimeLocalValue(e.target.value) })}
                className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-400">Sampai</label>
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(pengaturanEssai?.selesai_at ?? null)}
                onChange={(e) => handleUpdatePengaturanEssai({ selesai_at: fromDatetimeLocalValue(e.target.value) })}
                className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            {(pengaturanEssai?.mulai_at || pengaturanEssai?.selesai_at) && (
              <button
                onClick={() => handleUpdatePengaturanEssai({ mulai_at: null, selesai_at: null })}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 underline"
              >
                Hapus jadwal
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-400">Durasi pengerjaan (menit)</label>
              <input
                type="number"
                min={1}
                value={pengaturanEssai?.durasi_menit ?? 60}
                onChange={(e) => handleUpdatePengaturanEssai({ durasi_menit: Math.max(1, Number(e.target.value)) })}
                className="w-20 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <label className="text-xs text-slate-500 dark:text-slate-400">
                Batas pelanggaran (keluar layar penuh/pindah tab)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Nonaktif"
                value={pengaturanEssai?.batas_pelanggaran ?? ""}
                onChange={(e) =>
                  handleUpdatePengaturanEssai({
                    batas_pelanggaran: e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-24 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Kosongkan tanggal untuk tanpa batas waktu tayang. Jawaban essai tidak dinilai otomatis -- perlu dikoreksi
            manual oleh guru.
          </p>
        </div>
      )}

      {tipeAktif === "pilihan_ganda" ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          {items.length === 0 && formFor !== "new" && (
            <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
              Belum ada soal {JENIS_LIST.find((j) => j.value === jenis)?.label} untuk {kelasLabel(kelas)}.
            </p>
          )}

          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {items.map((item, idx) => (
              <li key={item.id} className="px-5 py-4">
                {formFor === item.id ? (
                  <SoalForm
                    kelas={kelas}
                    jenis={jenis}
                    existingCount={items.length}
                    initial={item}
                    onCancel={() => setFormFor(null)}
                    onSaved={(updated) => {
                      setSoalList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                      setFormFor(null);
                    }}
                  />
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 mr-2">
                          {item.label_tp || "Umum"}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">Soal {idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setFormFor(item.id)}
                          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={busyId === item.id}
                          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                          title="Hapus"
                        >
                          {busyId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-800 dark:text-slate-200 mb-2 whitespace-pre-wrap">{item.pertanyaan}</p>
                    {item.gambar_soal_url && (
                      <img
                        src={item.gambar_soal_url}
                        alt="Gambar soal"
                        className="h-24 mb-3 rounded-md border border-slate-200 dark:border-slate-700 object-contain bg-white"
                      />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <OpsiPreview label="A" opsi={{ teks: item.opsi_a ?? "", gambar: item.opsi_a_gambar_url }} isKunci={item.kunci_jawaban === "A"} />
                      <OpsiPreview label="B" opsi={{ teks: item.opsi_b ?? "", gambar: item.opsi_b_gambar_url }} isKunci={item.kunci_jawaban === "B"} />
                      <OpsiPreview label="C" opsi={{ teks: item.opsi_c ?? "", gambar: item.opsi_c_gambar_url }} isKunci={item.kunci_jawaban === "C"} />
                      <OpsiPreview label="D" opsi={{ teks: item.opsi_d ?? "", gambar: item.opsi_d_gambar_url }} isKunci={item.kunci_jawaban === "D"} />
                    </div>
                  </div>
                )}
              </li>
            ))}

            {formFor === "new" && (
              <li className="px-5 py-4">
                <SoalForm
                  kelas={kelas}
                  jenis={jenis}
                  existingCount={items.length}
                  onCancel={() => setFormFor(null)}
                  onSaved={(created) => {
                    setSoalList((prev) => [...prev, created]);
                    setFormFor(null);
                  }}
                />
              </li>
            )}
          </ul>

          {formFor !== "new" && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setFormFor("new")}
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Soal
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          {itemsEssai.length === 0 && formFor !== "new" && (
            <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
              Belum ada soal essai {JENIS_LIST.find((j) => j.value === jenis)?.label} untuk {kelasLabel(kelas)}.
            </p>
          )}

          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {itemsEssai.map((item, idx) => (
              <li key={item.id} className="px-5 py-4">
                {formFor === item.id ? (
                  <SoalEssaiForm
                    kelas={kelas}
                    jenis={jenis}
                    existingCount={itemsEssai.length}
                    initial={item}
                    onCancel={() => setFormFor(null)}
                    onSaved={(updated) => {
                      setSoalEssaiList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                      setFormFor(null);
                    }}
                  />
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 mr-2">
                          {item.label_tp || "Umum"}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">Soal {idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          Skor
                          <SkorInput
                            value={item.skor_maksimal}
                            onSave={(v) => handleUpdateSkorMaksimal(item, v)}
                          />
                        </label>
                        <div className="flex items-center gap-1">
                        <button
                          onClick={() => setFormFor(item.id)}
                          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEssai(item)}
                          disabled={busyId === item.id}
                          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                          title="Hapus"
                        >
                          {busyId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                        </div>
                      </div>
                    </div>

                    <div
                      className="text-sm text-slate-800 dark:text-slate-200 mb-2 prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.pertanyaan) }}
                    />
                    {item.gambar_soal_url && (
                      <img
                        src={item.gambar_soal_url}
                        alt="Gambar soal"
                        className="h-24 mb-3 rounded-md border border-slate-200 dark:border-slate-700 object-contain bg-white"
                      />
                    )}

                    <div className="rounded-md border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2">
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                        Kunci Jawaban
                      </p>
                      <div
                        className="text-sm text-slate-700 dark:text-slate-200 prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.kunci_jawaban) }}
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}

            {formFor === "new" && (
              <li className="px-5 py-4">
                <SoalEssaiForm
                  kelas={kelas}
                  jenis={jenis}
                  existingCount={itemsEssai.length}
                  onCancel={() => setFormFor(null)}
                  onSaved={(created) => {
                    setSoalEssaiList((prev) => [...prev, created]);
                    setFormFor(null);
                  }}
                />
              </li>
            )}
          </ul>

          {formFor !== "new" && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setFormFor("new")}
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Soal Essai
              </button>
            </div>
          )}
        </div>
      )}

      {showImport && (
        <SoalImportModal
          kelas={kelas}
          defaultJenis={jenis}
          existingCount={items.length}
          onCancel={() => setShowImport(false)}
          onImported={(created) => {
            setSoalList((prev) => [...prev, ...created]);
            setShowImport(false);
          }}
        />
      )}
    </div>
  );
}
