-- =====================================================================
-- Tambah kolom rombel (mis. VII.1, VIII.3) pada jurnal_mengajar, untuk
-- kolom "Kelas" di tabel Jurnal Mengajar.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table jurnal_mengajar
  add column if not exists rombel text not null default '';
