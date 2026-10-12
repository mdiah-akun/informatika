-- =====================================================================
-- Jurnal Mengajar: catatan harian guru per pertemuan, dipisah per kelas
-- (VII/VIII/IX). Khusus admin -- tidak ada akses siswa sama sekali.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists jurnal_mengajar (
  id uuid primary key default gen_random_uuid(),
  kelas smallint not null check (kelas in (7, 8, 9)),
  pertemuan_ke int not null,
  tanggal date not null,
  jam_ke text not null default '',
  pokok_bahasan text not null default '',
  ketercapaian text not null default '',
  catatan_sikap text not null default '',
  pesan_harian text not null default '',
  created_at timestamptz not null default now()
);

alter table jurnal_mengajar enable row level security;

drop policy if exists "Admin kelola jurnal mengajar" on jurnal_mengajar;
create policy "Admin kelola jurnal mengajar"
  on jurnal_mengajar for all
  to authenticated
  using (is_admin())
  with check (is_admin());
