-- =====================================================================
-- Tambah rentang waktu tayang soal (mulai & selesai) ke pengaturan
-- per kombinasi kelas + jenis yang sudah ada (acak_soal, acak_opsi).
-- Dipakai nanti oleh fitur siswa mengerjakan soal online, supaya soal
-- hanya bisa diakses dalam rentang waktu yang ditentukan admin.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table soal_pengaturan add column if not exists mulai_at timestamptz;
alter table soal_pengaturan add column if not exists selesai_at timestamptz;
