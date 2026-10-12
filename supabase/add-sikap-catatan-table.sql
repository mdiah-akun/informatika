-- =====================================================================
-- Catatan sikap siswa: riwayat sikap (positif/negatif) yang dicatat guru
-- untuk tiap siswa. Nama dan poin disalin saat dicatat, jadi riwayat
-- tidak berubah kalau daftar sikap diedit/dihapus nanti.
-- Khusus admin -- tidak ada akses siswa.
-- Jalankan di Supabase -> SQL Editor (setelah add-sikap-table.sql).
-- =====================================================================

create table if not exists sikap_catatan (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid not null references siswa(id) on delete cascade,
  sikap_id uuid references sikap(id) on delete set null,
  jenis text not null check (jenis in ('positif', 'negatif')),
  nama text not null,
  poin int not null,
  tanggal date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists sikap_catatan_siswa_idx on sikap_catatan (siswa_id, tanggal);

alter table sikap_catatan enable row level security;

drop policy if exists "Admin kelola catatan sikap" on sikap_catatan;
create policy "Admin kelola catatan sikap"
  on sikap_catatan for all
  to authenticated
  using (is_admin())
  with check (is_admin());
