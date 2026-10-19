-- =====================================================================
-- Seting Nilai: bobot Nilai Raport (Formatif, Sumatif Lingkup Materi,
-- Sumatif Akhir Semester). Satu baris saja (id = 1).
-- Khusus admin -- tidak ada akses siswa.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists nilai_bobot (
  id int primary key default 1 check (id = 1),
  bobot_f numeric not null default 1 check (bobot_f >= 0),
  bobot_s numeric not null default 2 check (bobot_s >= 0),
  bobot_sa numeric not null default 2 check (bobot_sa >= 0),
  persen_akademik numeric not null default 90 check (persen_akademik between 0 and 100),
  persen_kehadiran numeric not null default 10 check (persen_kehadiran between 0 and 100),
  persen_lain numeric not null default 5 check (persen_lain between 0 and 100),
  persen_punishment numeric not null default 5 check (persen_punishment between 0 and 100),
  tp_pakai_ambang boolean not null default true,
  tp_batas_optimum int not null default 68 check (tp_batas_optimum between 0 and 100),
  tp_batas_minimum int not null default 67 check (tp_batas_minimum between 0 and 100),
  updated_at timestamptz not null default now()
);

-- Kalau tabel sudah dibuat dari versi sebelumnya, tambahkan kolom persentase:
alter table nilai_bobot add column if not exists persen_akademik numeric not null default 90 check (persen_akademik between 0 and 100);
alter table nilai_bobot add column if not exists persen_kehadiran numeric not null default 10 check (persen_kehadiran between 0 and 100);
alter table nilai_bobot add column if not exists persen_lain numeric not null default 5 check (persen_lain between 0 and 100);
alter table nilai_bobot add column if not exists persen_punishment numeric not null default 5 check (persen_punishment between 0 and 100);

-- Ambang nilai TP Optimum - Minimum:
alter table nilai_bobot add column if not exists tp_pakai_ambang boolean not null default true;
alter table nilai_bobot add column if not exists tp_batas_optimum int not null default 68 check (tp_batas_optimum between 0 and 100);
alter table nilai_bobot add column if not exists tp_batas_minimum int not null default 67 check (tp_batas_minimum between 0 and 100);

insert into nilai_bobot (id) values (1) on conflict (id) do nothing;

alter table nilai_bobot enable row level security;

drop policy if exists "Admin kelola bobot nilai" on nilai_bobot;
create policy "Admin kelola bobot nilai"
  on nilai_bobot for all
  to authenticated
  using (is_admin())
  with check (is_admin());
