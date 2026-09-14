-- =====================================================================
-- Perbaikan: "infinite recursion detected in policy for relation profiles"
-- Policy lama mengecek role admin lewat sub-query ke tabel profiles di
-- dalam policy tabel profiles itu sendiri -> Postgres mengevaluasi ulang
-- policy yang sama pada sub-query itu -> recursion. Fungsi SECURITY
-- DEFINER di bawah dimiliki role pemilik tabel (postgres), yang otomatis
-- bypass RLS pada tabelnya sendiri, jadi tidak recursive.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

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

-- profiles
drop policy if exists "Lihat profil sendiri atau semua jika admin" on profiles;
create policy "Lihat profil sendiri atau semua jika admin"
  on profiles for select
  using (auth.uid() = id or is_admin());

-- bab
drop policy if exists "Admin kelola bab" on bab;
create policy "Admin kelola bab"
  on bab for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- materi
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

-- storage: gambar materi
drop policy if exists "Admin upload gambar materi" on storage.objects;
create policy "Admin upload gambar materi"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'materi-gambar' and is_admin());

drop policy if exists "Admin update gambar materi" on storage.objects;
create policy "Admin update gambar materi"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'materi-gambar' and is_admin());

drop policy if exists "Admin hapus gambar materi" on storage.objects;
create policy "Admin hapus gambar materi"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'materi-gambar' and is_admin());
