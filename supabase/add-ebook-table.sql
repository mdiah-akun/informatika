-- =====================================================================
-- Tabel e-book: pegangan Guru dan pegangan Siswa, per tingkat kelas
-- (VII/VIII/IX). Siswa cuma bisa lihat yang jenis='siswa'; admin bisa
-- kelola semuanya. File disimpan lewat AttachmentPicker yang sama
-- dipakai materi (bucket storage "materi-file").
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists ebook (
  id uuid primary key default gen_random_uuid(),
  jenis text not null check (jenis in ('guru', 'siswa')),
  kelas smallint not null check (kelas in (7, 8, 9)),
  judul text not null,
  file_url text not null,
  file_name text,
  file_type text,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table ebook enable row level security;

drop policy if exists "Siswa lihat ebook siswa, admin lihat semua" on ebook;
create policy "Siswa lihat ebook siswa, admin lihat semua"
  on ebook for select
  to authenticated
  using (jenis = 'siswa' or is_admin());

drop policy if exists "Admin kelola ebook" on ebook;
create policy "Admin kelola ebook"
  on ebook for all
  to authenticated
  using (is_admin())
  with check (is_admin());
