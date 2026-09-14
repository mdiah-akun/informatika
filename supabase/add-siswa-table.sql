-- =====================================================================
-- Tabel data siswa (roster): NISN, nama, kelas -- terpisah dari tabel
-- profiles (akun login). Dipakai di halaman admin -> Data Siswa untuk
-- kelola daftar siswa per kelas (VII/VIII/IX), tidak otomatis terhubung
-- ke akun login siswa.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists siswa (
  id uuid primary key default gen_random_uuid(),
  nisn text unique,
  nama text not null,
  kelas smallint not null,
  created_at timestamptz not null default now()
);

alter table siswa drop constraint if exists siswa_kelas_check;
alter table siswa add constraint siswa_kelas_check check (kelas in (7, 8, 9));

alter table siswa enable row level security;

drop policy if exists "Admin kelola data siswa" on siswa;
create policy "Admin kelola data siswa"
  on siswa for all
  to authenticated
  using (is_admin())
  with check (is_admin());
