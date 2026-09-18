-- =====================================================================
-- 1) Sederhanakan label soal: ganti dari referensi ke tabel materi
--    menjadi teks bebas TP1..TP20 (dipilih dari dropdown tetap di UI).
-- 2) Tambah pengaturan acak soal & acak opsi jawaban, per kombinasi
--    kelas + jenis (harian/sts/sas) -- dipakai nanti oleh fitur siswa
--    mengerjakan soal online.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table soal add column if not exists label_tp text;

alter table soal drop constraint if exists soal_materi_id_fkey;
alter table soal drop column if exists materi_id;

create table if not exists soal_pengaturan (
  kelas smallint not null check (kelas in (7, 8, 9)),
  jenis text not null check (jenis in ('harian', 'sts', 'sas')),
  acak_soal boolean not null default false,
  acak_opsi boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (kelas, jenis)
);

alter table soal_pengaturan enable row level security;

drop policy if exists "Admin kelola pengaturan soal" on soal_pengaturan;
create policy "Admin kelola pengaturan soal"
  on soal_pengaturan for all
  to authenticated
  using (is_admin())
  with check (is_admin());
