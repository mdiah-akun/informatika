-- =====================================================================
-- Storage bucket untuk file lampiran materi (PDF, HTML, dll -- beda dari
-- "materi-gambar" yang khusus gambar inline di editor). Publik (read)
-- supaya siswa yang sudah login bisa buka/unduh tanpa signed URL;
-- upload/hapus dibatasi ke admin. Jalankan di Supabase -> SQL Editor.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('materi-file', 'materi-file', true)
on conflict (id) do nothing;

drop policy if exists "Public read file materi" on storage.objects;
create policy "Public read file materi"
  on storage.objects for select
  using (bucket_id = 'materi-file');

drop policy if exists "Admin upload file materi" on storage.objects;
create policy "Admin upload file materi"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'materi-file' and is_admin());

drop policy if exists "Admin update file materi" on storage.objects;
create policy "Admin update file materi"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'materi-file' and is_admin());

drop policy if exists "Admin hapus file materi" on storage.objects;
create policy "Admin hapus file materi"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'materi-file' and is_admin());
