-- =====================================================================
-- Kisi-kisi: daftar kisi-kisi (ujian/penilaian) per kelas (VII/VIII/IX).
-- Admin kelola; siswa hanya bisa melihat.
-- Kalau versi lama (per bab) sudah pernah dijalankan, hapus dulu:
--   drop table if exists kisi_kisi;
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists kisi_kisi (
  id uuid primary key default gen_random_uuid(),
  kelas smallint not null check (kelas in (7, 8, 9)),
  judul text not null,
  isi text not null default '',
  url text,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists kisi_kisi_kelas_idx on kisi_kisi (kelas, urutan);

alter table kisi_kisi enable row level security;

drop policy if exists "Admin kelola kisi-kisi" on kisi_kisi;
create policy "Admin kelola kisi-kisi"
  on kisi_kisi for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Siswa (semua pengguna yang login) boleh melihat kisi-kisi, hanya baca.
drop policy if exists "Pengguna login lihat kisi-kisi" on kisi_kisi;
create policy "Pengguna login lihat kisi-kisi"
  on kisi_kisi for select
  to authenticated
  using (true);
