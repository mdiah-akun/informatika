-- =====================================================================
-- Fitur siswa mengerjakan soal online:
-- 1) Durasi pengerjaan (menit) ditambahkan ke pengaturan per kelas+jenis.
-- 2) Tabel soal_attempt mencatat satu kali pengerjaan per siswa per
--    kombinasi kelas+jenis (unique constraint menegakkan aturan "1 kali
--    kesempatan"). Diakses HANYA lewat API route dengan service role
--    (bukan langsung dari client), jadi RLS di sini admin-only saja --
--    aman karena skor & kunci jawaban tidak pernah dikirim ke browser
--    siswa sebelum mereka submit.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table soal_pengaturan add column if not exists durasi_menit integer not null default 60;

create table if not exists soal_attempt (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid not null references auth.users(id) on delete cascade,
  kelas smallint not null check (kelas in (7, 8, 9)),
  jenis text not null check (jenis in ('harian', 'sts', 'sas')),
  mulai_at timestamptz not null default now(),
  batas_at timestamptz not null,
  selesai_at timestamptz,
  jawaban jsonb not null default '{}'::jsonb,
  skor numeric,
  jumlah_benar int,
  jumlah_soal int,
  status text not null default 'berjalan' check (status in ('berjalan', 'selesai')),
  created_at timestamptz not null default now(),
  unique (siswa_id, kelas, jenis)
);

alter table soal_attempt enable row level security;

drop policy if exists "Admin kelola semua attempt" on soal_attempt;
create policy "Admin kelola semua attempt"
  on soal_attempt for all
  to authenticated
  using (is_admin())
  with check (is_admin());
