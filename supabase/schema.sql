-- =====================================================================
-- Skema CMS Materi Informatika Kelas 9. Jalankan di Supabase -> SQL Editor
-- pada project Supabase BARU (terpisah dari siswa-app).
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles: satu baris per akun auth.users, nyimpen nama & role.
-- role 'siswa' = default untuk pendaftar mandiri, 'admin' = guru/pengelola
-- konten (naikkan role manual lewat SQL Editor setelah akun dibuat).
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null default '',
  role text not null default 'siswa' check (role in ('admin', 'siswa')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Fungsi SECURITY DEFINER untuk cek role admin. WAJIB dipakai (bukan
-- sub-query "select ... from profiles" langsung) di dalam policy tabel
-- profiles -- kalau tidak, Postgres mengevaluasi ulang policy select
-- profiles di dalam sub-query-nya sendiri dan menyebabkan "infinite
-- recursion detected in policy for relation profiles". Fungsi ini
-- dimiliki role pemilik tabel (postgres), yang otomatis bypass RLS pada
-- tabelnya sendiri, jadi query di dalamnya tidak recursive.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Lihat profil sendiri atau semua jika admin" on profiles;
create policy "Lihat profil sendiri atau semua jika admin"
  on profiles for select
  using (auth.uid() = id or is_admin());

drop policy if exists "Update profil sendiri" on profiles;
create policy "Update profil sendiri"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger: bikin baris profiles otomatis saat ada akun auth baru (signup).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nama)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------
-- bab: pengelompokan materi (mis. "Bab 1 - Berpikir Komputasional")
-- ---------------------------------------------------------------------
create table if not exists bab (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table bab enable row level security;

drop policy if exists "Semua user login boleh lihat bab" on bab;
create policy "Semua user login boleh lihat bab"
  on bab for select
  to authenticated
  using (true);

drop policy if exists "Admin kelola bab" on bab;
create policy "Admin kelola bab"
  on bab for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------
-- materi: satu halaman materi di dalam sebuah bab
-- ---------------------------------------------------------------------
create table if not exists materi (
  id uuid primary key default gen_random_uuid(),
  bab_id uuid not null references bab(id) on delete cascade,
  judul text not null,
  slug text not null unique,
  konten text not null default '',
  urutan int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table materi enable row level security;

drop policy if exists "Siswa lihat materi terbit, admin lihat semua" on materi;
create policy "Siswa lihat materi terbit, admin lihat semua"
  on materi for select
  to authenticated
  using (published = true or is_admin());

drop policy if exists "Admin kelola materi" on materi;
create policy "Admin kelola materi"
  on materi for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Setelah signup pertama sebagai admin (lewat halaman /signup atau Supabase
-- Auth dashboard), jalankan ini untuk menaikkan role jadi admin:
-- update profiles set role = 'admin' where id = '<user-id-dari-auth.users>';
