-- =====================================================================
-- Presensi (rekap per pertemuan, seperti buku presensi):
--   presensi_sesi : satu kolom pertemuan per rombel (tanggal).
--   presensi_isi  : kode kehadiran tiap siswa pada tiap pertemuan.
-- Kode: H=Hadir, S=Sakit, I=Ijin, L=Terlambat, M=Minggat/tidak masuk
-- kelas, A=Alpa, P=Pulang, G=Dipanggil Guru.
-- Khusus admin -- tidak ada akses siswa.
--
-- Struktur lama (tabel "presensi", satu baris per siswa per tanggal)
-- diganti. Tabel itu masih kosong saat dicek, jadi aman dihapus.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

drop table if exists presensi;

create table if not exists presensi_sesi (
  id uuid primary key default gen_random_uuid(),
  rombel text not null,
  tanggal date not null,
  created_at timestamptz not null default now(),
  unique (rombel, tanggal)
);

create table if not exists presensi_isi (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references presensi_sesi(id) on delete cascade,
  siswa_id uuid not null references siswa(id) on delete cascade,
  status text not null check (status in ('H', 'S', 'I', 'L', 'M', 'A', 'P', 'G')),
  created_at timestamptz not null default now(),
  unique (sesi_id, siswa_id)
);

create index if not exists presensi_isi_sesi_idx on presensi_isi (sesi_id);

alter table presensi_sesi enable row level security;
alter table presensi_isi enable row level security;

drop policy if exists "Admin kelola presensi sesi" on presensi_sesi;
create policy "Admin kelola presensi sesi"
  on presensi_sesi for all
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin kelola presensi isi" on presensi_isi;
create policy "Admin kelola presensi isi"
  on presensi_isi for all
  to authenticated
  using (is_admin())
  with check (is_admin());
