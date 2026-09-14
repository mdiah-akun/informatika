-- =====================================================================
-- Tambahan: sub-materi / lampiran tambahan per materi (video YouTube,
-- file tugas siswa, dll) -- satu materi bisa punya banyak lampiran ini,
-- berbeda dari kolom file_url di tabel materi yang cuma satu.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists materi_lampiran (
  id uuid primary key default gen_random_uuid(),
  materi_id uuid not null references materi(id) on delete cascade,
  judul text not null,
  file_url text not null,
  file_name text,
  file_type text,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table materi_lampiran enable row level security;

drop policy if exists "Lihat lampiran materi terbit, admin lihat semua" on materi_lampiran;
create policy "Lihat lampiran materi terbit, admin lihat semua"
  on materi_lampiran for select
  to authenticated
  using (
    is_admin()
    or exists (select 1 from materi m where m.id = materi_lampiran.materi_id and m.published = true)
  );

drop policy if exists "Admin kelola lampiran materi" on materi_lampiran;
create policy "Admin kelola lampiran materi"
  on materi_lampiran for all
  to authenticated
  using (is_admin())
  with check (is_admin());
