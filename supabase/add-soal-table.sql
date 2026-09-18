-- =====================================================================
-- Bank soal pilihan ganda (A/B/C/D), dipakai untuk soal harian per bab,
-- STS, maupun SAS. Soal dan tiap opsi jawaban boleh disertai gambar.
-- Fitur ini admin-only untuk sekarang (belum ada sisi siswa mengerjakan).
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists soal (
  id uuid primary key default gen_random_uuid(),
  kelas smallint not null check (kelas in (7, 8, 9)),
  -- Label soal berasal dari materi/TP mana -- boleh kosong (mis. soal
  -- STS/SAS yang mencakup beberapa TP sekaligus).
  materi_id uuid references materi(id) on delete set null,
  jenis text not null check (jenis in ('harian', 'sts', 'sas')),
  pertanyaan text not null,
  gambar_soal_url text,
  opsi_a text,
  opsi_a_gambar_url text,
  opsi_b text,
  opsi_b_gambar_url text,
  opsi_c text,
  opsi_c_gambar_url text,
  opsi_d text,
  opsi_d_gambar_url text,
  kunci_jawaban text not null check (kunci_jawaban in ('A', 'B', 'C', 'D')),
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table soal enable row level security;

drop policy if exists "Admin kelola soal" on soal;
create policy "Admin kelola soal"
  on soal for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- =====================================================================
-- Storage bucket untuk gambar soal & gambar opsi jawaban.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('soal-gambar', 'soal-gambar', true)
on conflict (id) do nothing;

drop policy if exists "Public read gambar soal" on storage.objects;
create policy "Public read gambar soal"
  on storage.objects for select
  using (bucket_id = 'soal-gambar');

drop policy if exists "Admin upload gambar soal" on storage.objects;
create policy "Admin upload gambar soal"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'soal-gambar' and is_admin());

drop policy if exists "Admin update gambar soal" on storage.objects;
create policy "Admin update gambar soal"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'soal-gambar' and is_admin());

drop policy if exists "Admin hapus gambar soal" on storage.objects;
create policy "Admin hapus gambar soal"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'soal-gambar' and is_admin());
