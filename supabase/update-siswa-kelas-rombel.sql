-- =====================================================================
-- Ubah kolom kelas di tabel siswa dari angka tingkat (7/8/9) jadi teks
-- rombel lengkap (mis. "VII.1", "VIII.2", "IX.3"), supaya bisa dipisah
-- per kelas/rombongan belajar, bukan cuma per tingkat.
-- (Ini TIDAK memengaruhi kolom kelas di tabel bab -- itu tetap tingkat
-- 7/8/9 untuk pengelompokan materi per jenjang.)
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table siswa drop constraint if exists siswa_kelas_check;

alter table siswa
  alter column kelas type text
  using (case kelas::text
    when '7' then 'VII'
    when '8' then 'VIII'
    when '9' then 'IX'
    else kelas::text
  end);

alter table siswa add constraint siswa_kelas_check
  check (kelas ~ '^(VII|VIII|IX)(\.[0-9]+)?$');
