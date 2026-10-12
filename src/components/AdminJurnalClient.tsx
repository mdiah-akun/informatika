"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KELAS_LIST, kelasLabel } from "@/lib/kelas";
import type { JurnalMengajar } from "@/types/jurnal";
import type { Kelas } from "@/types/materi";
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";

const KETERCAPAIAN_OPSI = ["Tercapai", "Sebagian tercapai", "Belum tercapai"];

const inputClass =
  "w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1";

function formatTanggal(tgl: string): string {
  return new Date(`${tgl}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function hariIni(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const ROMAN: Record<Kelas, string> = { 7: "VII", 8: "VIII", 9: "IX" };

function JurnalForm({
  kelas,
  rombelOpsi,
  defaultPertemuan,
  initial,
  onCancel,
  onSaved,
}: {
  kelas: Kelas;
  rombelOpsi: string[];
  defaultPertemuan: number;
  initial?: JurnalMengajar;
  onCancel: () => void;
  onSaved: (item: JurnalMengajar) => void;
}) {
  const [rombel, setRombel] = useState(initial?.rombel ?? "");
  const opsi = rombel && !rombelOpsi.includes(rombel) ? [rombel, ...rombelOpsi] : rombelOpsi;
  const [pertemuanKe, setPertemuanKe] = useState(initial?.pertemuan_ke ?? defaultPertemuan);
  const [tanggal, setTanggal] = useState(initial?.tanggal ?? hariIni());
  const [jamKe, setJamKe] = useState(initial?.jam_ke ?? "");
  const [pokokBahasan, setPokokBahasan] = useState(initial?.pokok_bahasan ?? "");
  const [ketercapaian, setKetercapaian] = useState(initial?.ketercapaian ?? "");
  const [catatanSikap, setCatatanSikap] = useState(initial?.catatan_sikap ?? "");
  const [pesanHarian, setPesanHarian] = useState(initial?.pesan_harian ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tanggal) {
      setError("Tanggal wajib diisi.");
      return;
    }
    if (!pokokBahasan.trim()) {
      setError("Pokok bahasan wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      kelas,
      rombel: rombel.trim(),
      pertemuan_ke: pertemuanKe,
      tanggal,
      jam_ke: jamKe.trim(),
      pokok_bahasan: pokokBahasan.trim(),
      ketercapaian: ketercapaian.trim(),
      catatan_sikap: catatanSikap.trim(),
      pesan_harian: pesanHarian.trim(),
    };

    const query = initial
      ? supabase.from("jurnal_mengajar").update(payload).eq("id", initial.id).select().single()
      : supabase.from("jurnal_mengajar").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Gagal menyimpan jurnal.");
      return;
    }
    onSaved(data as JurnalMengajar);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className={labelClass}>Kelas</label>
          <select value={rombel} onChange={(e) => setRombel(e.target.value)} className={inputClass}>
            <option value="">- Pilih kelas -</option>
            {opsi.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Pertemuan ke</label>
          <input
            type="number"
            min={1}
            value={pertemuanKe}
            onChange={(e) => setPertemuanKe(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tanggal</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Jam ke</label>
          <input
            value={jamKe}
            onChange={(e) => setJamKe(e.target.value)}
            placeholder="mis. 3-4"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Pokok Bahasan</label>
        <textarea
          rows={2}
          autoFocus
          value={pokokBahasan}
          onChange={(e) => setPokokBahasan(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Ketercapaian</label>
          <input
            list="opsi-ketercapaian"
            value={ketercapaian}
            onChange={(e) => setKetercapaian(e.target.value)}
            placeholder="Tercapai / Sebagian tercapai"
            className={inputClass}
          />
          <datalist id="opsi-ketercapaian">
            {KETERCAPAIAN_OPSI.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelClass}>Catatan Sikap Murid</label>
          <textarea rows={2} value={catatanSikap} onChange={(e) => setCatatanSikap(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Pesan Harian</label>
          <textarea rows={2} value={pesanHarian} onChange={(e) => setPesanHarian(e.target.value)} className={inputClass} />
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

export default function AdminJurnalClient({
  jurnalAwal,
  rombelList,
}: {
  jurnalAwal: JurnalMengajar[];
  rombelList: string[];
}) {
  const [list, setList] = useState<JurnalMengajar[]>(jurnalAwal);
  const [kelas, setKelas] = useState<Kelas>(KELAS_LIST[0]);
  const [formFor, setFormFor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = list
    .filter((j) => j.kelas === kelas)
    .sort((a, b) => a.pertemuan_ke - b.pertemuan_ke || a.tanggal.localeCompare(b.tanggal));

  const rombelOpsi = rombelList.filter((r) => r.startsWith(`${ROMAN[kelas]}.`));

  const pertemuanBerikut = items.length > 0 ? Math.max(...items.map((j) => j.pertemuan_ke)) + 1 : 1;

  async function handleDelete(item: JurnalMengajar) {
    if (!confirm(`Hapus jurnal pertemuan ke-${item.pertemuan_ke}?`)) return;
    setBusyId(item.id);
    const supabase = createClient();
    const { error } = await supabase.from("jurnal_mengajar").delete().eq("id", item.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setList((prev) => prev.filter((j) => j.id !== item.id));
  }

  const cell = "px-3 py-3 align-top text-slate-700 dark:text-slate-200 whitespace-pre-wrap";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Jurnal Mengajar</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Catatan pembelajaran per pertemuan untuk tiap kelas. Menu ini hanya terlihat oleh admin.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
        {KELAS_LIST.map((k) => (
          <button
            key={k}
            onClick={() => {
              setKelas(k);
              setFormFor(null);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              kelas === k
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {kelasLabel(k)}
          </button>
        ))}
      </div>

      {formFor === "new" && (
        <div className="mb-4">
          <JurnalForm
            kelas={kelas}
            rombelOpsi={rombelOpsi}
            defaultPertemuan={pertemuanBerikut}
            onCancel={() => setFormFor(null)}
            onSaved={(created) => {
              setList((prev) => [...prev, created]);
              setFormFor(null);
            }}
          />
        </div>
      )}

      {formFor !== "new" && (
        <div className="mb-4">
          <button
            onClick={() => setFormFor("new")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3 py-2 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Jurnal
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 text-left text-slate-500 dark:text-slate-400">
                <th className="px-3 py-3 font-medium w-10">No</th>
                <th className="px-3 py-3 font-medium">Kelas</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Pertemuan ke</th>
                <th className="px-3 py-3 font-medium">Tanggal</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Jam ke</th>
                <th className="px-3 py-3 font-medium min-w-[200px]">Pokok Bahasan</th>
                <th className="px-3 py-3 font-medium">Ketercapaian</th>
                <th className="px-3 py-3 font-medium min-w-[160px]">Catatan Sikap Murid</th>
                <th className="px-3 py-3 font-medium min-w-[160px]">Pesan Harian</th>
                <th className="px-3 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                    Belum ada jurnal untuk {kelasLabel(kelas)}.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) =>
                  formFor === item.id ? (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/60">
                      <td colSpan={10} className="p-3">
                        <JurnalForm
                          kelas={kelas}
                          rombelOpsi={rombelOpsi}
                          defaultPertemuan={pertemuanBerikut}
                          initial={item}
                          onCancel={() => setFormFor(null)}
                          onSaved={(updated) => {
                            setList((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
                            setFormFor(null);
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700"
                    >
                      <td className={`${cell} text-slate-500 dark:text-slate-400`}>{idx + 1}</td>
                      <td className={`${cell} whitespace-nowrap`}>{item.rombel || "-"}</td>
                      <td className={cell}>{item.pertemuan_ke}</td>
                      <td className={`${cell} whitespace-nowrap`}>{formatTanggal(item.tanggal)}</td>
                      <td className={cell}>{item.jam_ke || "-"}</td>
                      <td className={cell}>{item.pokok_bahasan}</td>
                      <td className={cell}>{item.ketercapaian || "-"}</td>
                      <td className={cell}>{item.catatan_sikap || "-"}</td>
                      <td className={cell}>{item.pesan_harian || "-"}</td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center justify-end gap-1">
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
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
