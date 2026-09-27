-- =====================================================================
-- Tambah kolom semester (Ganjil / Genap) pada tabel tp.
-- TP yang sudah ada otomatis diberi 'Ganjil' -- ubah lewat menu TP
-- kalau ada yang seharusnya Genap.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table tp
  add column if not exists semester text not null default 'Ganjil'
  check (semester in ('Ganjil', 'Genap'));
