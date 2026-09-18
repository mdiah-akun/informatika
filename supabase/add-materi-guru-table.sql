-- =====================================================================
-- Tabel materi guru: link materi pegangan guru (bahan ajar, presentasi,
-- dll). Khusus admin -- tidak ada akses siswa sama sekali.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists materi_guru (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  kategori text not null default 'Lainnya' check (kategori in ('Bahan Ajar', 'Presentasi', 'Lainnya')),
  url text not null,
  keterangan text,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table materi_guru enable row level security;

drop policy if exists "Admin kelola materi guru" on materi_guru;
create policy "Admin kelola materi guru"
  on materi_guru for all
  to authenticated
  using (is_admin())
  with check (is_admin());
