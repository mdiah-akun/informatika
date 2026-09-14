-- =====================================================================
-- Tambahan: gambar sampul per materi, ditampilkan di daftar materi
-- (kartu dua kolom: gambar kiri, deskripsi kanan) dan di halaman detail.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table materi
  add column if not exists gambar_url text;
