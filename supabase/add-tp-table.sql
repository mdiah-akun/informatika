-- =====================================================================
-- Tujuan Pembelajaran (TP) per bab. Terpisah dari tabel materi -- ini
-- catatan ringkas kode + deskripsi TP yang bisa dilihat siswa dan
-- dikelola admin/guru, mirip pola tabel bab.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists tp (
  id uuid primary key default gen_random_uuid(),
  bab_id uuid not null references bab(id) on delete cascade,
  kode text not null,
  deskripsi text not null,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table tp enable row level security;

drop policy if exists "Semua user login boleh lihat tp" on tp;
create policy "Semua user login boleh lihat tp"
  on tp for select
  to authenticated
  using (true);

drop policy if exists "Admin kelola tp" on tp;
create policy "Admin kelola tp"
  on tp for all
  to authenticated
  using (is_admin())
  with check (is_admin());
