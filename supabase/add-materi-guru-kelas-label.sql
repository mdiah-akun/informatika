-- =====================================================================
-- Tambah kolom kelas (VII/VIII/IX), label_bab, dan label_tp (keduanya
-- input manual guru, bukan tabel Bab/TP resmi) pada materi_guru.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table materi_guru
  add column if not exists kelas smallint not null default 7 check (kelas in (7, 8, 9)),
  add column if not exists label_bab text,
  add column if not exists label_tp text;

alter table materi_guru alter column kelas drop default;
