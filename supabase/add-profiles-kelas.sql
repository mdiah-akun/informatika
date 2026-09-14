-- =====================================================================
-- Tambahan: kolom kelas (rombel, mis. "VII.6") di tabel profiles, supaya
-- saat siswa login, halaman /materi bisa otomatis default ke tingkat
-- kelasnya sendiri (VII/VIII/IX) alih-alih selalu VII.
-- Diisi otomatis saat akun dibuat lewat "Import dari Data Siswa" di
-- /admin/users (trigger di bawah membaca dari user_metadata).
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table profiles add column if not exists kelas text;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nama, kelas)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', ''),
    new.raw_user_meta_data->>'kelas'
  );
  return new;
end;
$$;
