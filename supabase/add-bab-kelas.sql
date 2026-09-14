-- =====================================================================
-- Tambahan: kolom kelas (7/8/9) di tabel bab, supaya satu CMS ini bisa
-- dipakai untuk materi Informatika kelas VII, VIII, dan IX sekaligus,
-- dipisah lewat tab di sisi admin maupun siswa.
-- Bab yang sudah ada (materi kelas 9 yang sudah dibuat sebelumnya)
-- otomatis diberi kelas = 9 lewat default di bawah, jadi tidak hilang.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table bab
  add column if not exists kelas smallint not null default 9;

alter table bab drop constraint if exists bab_kelas_check;
alter table bab add constraint bab_kelas_check check (kelas in (7, 8, 9));
