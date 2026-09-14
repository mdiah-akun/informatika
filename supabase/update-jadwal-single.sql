-- =====================================================================
-- Jadwal pelajaran ternyata berlaku untuk semua kelas (satu gambar saja),
-- bukan per tingkat kelas. Sederhanakan tabel jadwal_pelajaran: hapus
-- kolom kelas, sisakan cuma 1 baris kalau sempat ada beberapa dari
-- percobaan sebelumnya.
-- Jalankan di Supabase -> SQL Editor. Aman dijalankan meski tabelnya
-- masih kosong / belum pernah diisi.
-- =====================================================================

delete from jadwal_pelajaran
where id not in (
  select id from jadwal_pelajaran order by updated_at desc limit 1
);

alter table jadwal_pelajaran drop constraint if exists jadwal_pelajaran_kelas_check;
alter table jadwal_pelajaran drop column if exists kelas;
