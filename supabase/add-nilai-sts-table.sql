-- =====================================================================
-- Nilai STS (PTS): nilai manual, remedial 1 & 2 per siswa per semester,
-- plus KKM untuk batas nilai remedial. PTS (Auto) tidak disimpan di sini:
-- dibaca langsung dari hasil ujian online STS (soal_attempt dan
-- soal_essai_attempt).
-- Khusus admin -- tidak ada akses siswa.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists nilai_sts (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid not null references siswa(id) on delete cascade,
  semester text not null check (semester in ('Ganjil', 'Genap')),
  pts_manual numeric(5, 2) check (pts_manual is null or (pts_manual >= 0 and pts_manual <= 100)),
  rem1 numeric(5, 2) check (rem1 is null or (rem1 >= 0 and rem1 <= 100)),
  rem2 numeric(5, 2) check (rem2 is null or (rem2 >= 0 and rem2 <= 100)),
  updated_at timestamptz not null default now(),
  unique (siswa_id, semester)
);

create index if not exists nilai_sts_siswa_idx on nilai_sts (siswa_id);

create table if not exists nilai_sts_pengaturan (
  id int primary key default 1 check (id = 1),
  kkm int not null default 74 check (kkm >= 0 and kkm <= 100)
);

insert into nilai_sts_pengaturan (id, kkm) values (1, 74) on conflict (id) do nothing;

alter table nilai_sts enable row level security;
alter table nilai_sts_pengaturan enable row level security;

drop policy if exists "Admin kelola nilai sts" on nilai_sts;
create policy "Admin kelola nilai sts"
  on nilai_sts for all
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin kelola pengaturan nilai sts" on nilai_sts_pengaturan;
create policy "Admin kelola pengaturan nilai sts"
  on nilai_sts_pengaturan for all
  to authenticated
  using (is_admin())
  with check (is_admin());
