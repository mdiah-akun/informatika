-- =====================================================================
-- Mode anti-nyontek (deteksi, bukan cegah total -- lihat penjelasan di
-- percakapan dengan guru): siswa wajib layar penuh saat mengerjakan;
-- keluar dari layar penuh atau berpindah tab/aplikasi dihitung sebagai
-- pelanggaran. Kalau jumlah pelanggaran melebihi batas, jawaban otomatis
-- dikumpulkan. batas_pelanggaran kosong/0 = fitur nonaktif untuk
-- kombinasi kelas+jenis itu.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table soal_pengaturan add column if not exists batas_pelanggaran integer;

alter table soal_attempt add column if not exists jumlah_pelanggaran integer not null default 0;
