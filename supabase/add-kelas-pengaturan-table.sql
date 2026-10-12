-- =====================================================================
-- Pengaturan Kelas: wali kelas, jenis Nilai Rapot, dan batas Nilai
-- Dongkrak (min/max) per rombel (mis. IX.1). Daftar rombel sendiri
-- diambil dari tabel siswa; tabel ini hanya menyimpan isiannya.
-- Khusus admin -- tidak ada akses siswa.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists kelas_pengaturan (
  rombel text primary key,
  wali_kelas text not null default '',
  nilai_rapot text check (
    nilai_rapot is null or nilai_rapot in ('Asli', 'Asli+Hadir', 'Dongkrak(asli)', 'Dongkrak(AsliHadir)')
  ),
  dongkrak_min int check (dongkrak_min is null or (dongkrak_min >= 0 and dongkrak_min <= 100)),
  dongkrak_max int check (dongkrak_max is null or (dongkrak_max >= 0 and dongkrak_max <= 100)),
  updated_at timestamptz not null default now(),
  check (dongkrak_min is null or dongkrak_max is null or dongkrak_min <= dongkrak_max)
);

alter table kelas_pengaturan enable row level security;

drop policy if exists "Admin kelola pengaturan kelas" on kelas_pengaturan;
create policy "Admin kelola pengaturan kelas"
  on kelas_pengaturan for all
  to authenticated
  using (is_admin())
  with check (is_admin());
