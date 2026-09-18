-- =====================================================================
-- Pengaturan tayang + durasi + batas pelanggaran untuk soal ESSAI,
-- mirip soal_pengaturan (tanpa acak_soal/acak_opsi -- tidak relevan
-- untuk essai), plus tabel attempt untuk mencatat pengerjaan siswa.
-- Essai TIDAK dinilai otomatis (perlu dikoreksi manual oleh guru),
-- jadi tidak ada kolom skor di sini.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists soal_essai_pengaturan (
  kelas smallint not null check (kelas in (7, 8, 9)),
  jenis text not null check (jenis in ('harian', 'sts', 'sas')),
  mulai_at timestamptz,
  selesai_at timestamptz,
  durasi_menit integer not null default 60,
  batas_pelanggaran integer,
  updated_at timestamptz not null default now(),
  primary key (kelas, jenis)
);

alter table soal_essai_pengaturan enable row level security;

drop policy if exists "Admin kelola pengaturan soal essai" on soal_essai_pengaturan;
create policy "Admin kelola pengaturan soal essai"
  on soal_essai_pengaturan for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create table if not exists soal_essai_attempt (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid not null references auth.users(id) on delete cascade,
  kelas smallint not null check (kelas in (7, 8, 9)),
  jenis text not null check (jenis in ('harian', 'sts', 'sas')),
  mulai_at timestamptz not null default now(),
  batas_at timestamptz not null,
  selesai_at timestamptz,
  jawaban jsonb not null default '{}'::jsonb,
  jumlah_pelanggaran integer not null default 0,
  status text not null default 'berjalan' check (status in ('berjalan', 'selesai')),
  created_at timestamptz not null default now(),
  unique (siswa_id, kelas, jenis)
);

alter table soal_essai_attempt enable row level security;

drop policy if exists "Admin kelola semua attempt essai" on soal_essai_attempt;
create policy "Admin kelola semua attempt essai"
  on soal_essai_attempt for all
  to authenticated
  using (is_admin())
  with check (is_admin());
