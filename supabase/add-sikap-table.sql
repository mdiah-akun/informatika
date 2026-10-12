-- =====================================================================
-- Sikap: daftar macam-macam sikap positif dan negatif beserta poinnya.
-- Khusus admin -- tidak ada akses siswa.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists sikap (
  id uuid primary key default gen_random_uuid(),
  jenis text not null check (jenis in ('positif', 'negatif')),
  nama text not null,
  poin int not null default 0,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists sikap_jenis_urutan_idx on sikap (jenis, urutan);

alter table sikap enable row level security;

drop policy if exists "Admin kelola sikap" on sikap;
create policy "Admin kelola sikap"
  on sikap for all
  to authenticated
  using (is_admin())
  with check (is_admin());
