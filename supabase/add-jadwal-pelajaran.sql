-- =====================================================================
-- Tabel jadwal pelajaran: satu gambar jadwal untuk semua kelas (bukan
-- per tingkat). Admin upload/ganti gambarnya di /admin/jadwal, siswa
-- lihat di /jadwal. Gambar disimpan di bucket storage "materi-gambar"
-- yang sudah ada.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists jadwal_pelajaran (
  id uuid primary key default gen_random_uuid(),
  gambar_url text,
  updated_at timestamptz not null default now()
);

alter table jadwal_pelajaran enable row level security;

drop policy if exists "Semua user login boleh lihat jadwal" on jadwal_pelajaran;
create policy "Semua user login boleh lihat jadwal"
  on jadwal_pelajaran for select
  to authenticated
  using (true);

drop policy if exists "Admin kelola jadwal" on jadwal_pelajaran;
create policy "Admin kelola jadwal"
  on jadwal_pelajaran for all
  to authenticated
  using (is_admin())
  with check (is_admin());
