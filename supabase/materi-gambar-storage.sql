-- =====================================================================
-- Storage bucket untuk gambar yang disisipkan ke konten materi (lewat
-- RichTextEditor di halaman admin). Publik (read) supaya siswa yang sudah
-- login bisa lihat gambar tanpa signed URL; upload/hapus dibatasi ke admin.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('materi-gambar', 'materi-gambar', true)
on conflict (id) do nothing;

drop policy if exists "Public read gambar materi" on storage.objects;
create policy "Public read gambar materi"
  on storage.objects for select
  using (bucket_id = 'materi-gambar');

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
