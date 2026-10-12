-- =====================================================================
-- Catat Nilai TP: nilai siswa per Tujuan Pembelajaran.
--   tp_nilai_kolom : satu kolom penilaian (tanggal + judul) pada sebuah TP
--                    untuk satu rombel.
--   tp_nilai       : nilai tiap siswa pada tiap kolom penilaian.
-- Kolom RATA dihitung di aplikasi (rata-rata nilai yang terisi).
-- Khusus admin -- tidak ada akses siswa.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists tp_nilai_kolom (
  id uuid primary key default gen_random_uuid(),
  tp_id uuid not null references tp(id) on delete cascade,
  rombel text not null,
  tanggal date,
  judul text not null default '',
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tp_nilai_kolom_tp_rombel_idx on tp_nilai_kolom (tp_id, rombel, urutan);

create table if not exists tp_nilai (
  id uuid primary key default gen_random_uuid(),
  kolom_id uuid not null references tp_nilai_kolom(id) on delete cascade,
  siswa_id uuid not null references siswa(id) on delete cascade,
  nilai numeric(5, 2) not null check (nilai >= 0 and nilai <= 100),
  created_at timestamptz not null default now(),
  unique (kolom_id, siswa_id)
);

create index if not exists tp_nilai_kolom_idx on tp_nilai (kolom_id);

alter table tp_nilai_kolom enable row level security;
alter table tp_nilai enable row level security;

drop policy if exists "Admin kelola kolom nilai tp" on tp_nilai_kolom;
create policy "Admin kelola kolom nilai tp"
  on tp_nilai_kolom for all
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin kelola nilai tp" on tp_nilai;
create policy "Admin kelola nilai tp"
  on tp_nilai for all
  to authenticated
  using (is_admin())
  with check (is_admin());
