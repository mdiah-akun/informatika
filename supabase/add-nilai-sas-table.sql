-- =====================================================================
-- Nilai SAS: sama seperti nilai_sts, untuk Sumatif Akhir Semester.
-- Nilai manual, remedial 1 & 2 per siswa per semester. SAS (Auto) dibaca
-- langsung dari hasil ujian online jenis SAS, dan KKM memakai
-- nilai_sts_pengaturan yang sama dengan Nilai STS.
-- Khusus admin -- tidak ada akses siswa.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists nilai_sas (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid not null references siswa(id) on delete cascade,
  semester text not null check (semester in ('Ganjil', 'Genap')),
  sas_manual numeric(5, 2) check (sas_manual is null or (sas_manual >= 0 and sas_manual <= 100)),
  rem1 numeric(5, 2) check (rem1 is null or (rem1 >= 0 and rem1 <= 100)),
  rem2 numeric(5, 2) check (rem2 is null or (rem2 >= 0 and rem2 <= 100)),
  updated_at timestamptz not null default now(),
  unique (siswa_id, semester)
);

create index if not exists nilai_sas_siswa_idx on nilai_sas (siswa_id);

alter table nilai_sas enable row level security;

drop policy if exists "Admin kelola nilai sas" on nilai_sas;
create policy "Admin kelola nilai sas"
  on nilai_sas for all
  to authenticated
  using (is_admin())
  with check (is_admin());
