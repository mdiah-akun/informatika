-- =====================================================================
-- Bank soal ESSAI, tabel terpisah dari soal pilihan ganda. Pertanyaan
-- dan kunci jawaban memakai teks kaya (HTML dari rich text editor).
-- Admin-only untuk sekarang (belum ada alur siswa mengerjakan essai
-- online -- itu perlu penilaian manual oleh guru).
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists soal_essai (
  id uuid primary key default gen_random_uuid(),
  kelas smallint not null check (kelas in (7, 8, 9)),
  label_tp text,
  jenis text not null check (jenis in ('harian', 'sts', 'sas')),
  pertanyaan text not null,
  gambar_soal_url text,
  kunci_jawaban text not null,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table soal_essai enable row level security;

drop policy if exists "Admin kelola soal essai" on soal_essai;
create policy "Admin kelola soal essai"
  on soal_essai for all
  to authenticated
  using (is_admin())
  with check (is_admin());
