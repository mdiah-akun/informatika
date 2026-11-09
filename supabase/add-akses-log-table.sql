-- =====================================================================
-- Akses Pengguna: catatan login dan halaman yang dibuka tiap pengguna.
-- Dicatat dari aplikasi (halaman login dan pelacak halaman di dashboard).
-- Hanya admin yang bisa membaca; tiap pengguna hanya bisa mencatat
-- aksesnya sendiri.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

create table if not exists akses_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  jenis text not null check (jenis in ('login', 'halaman')),
  path text,
  created_at timestamptz not null default now()
);

create index if not exists akses_log_user_idx on akses_log (user_id, created_at desc);

alter table akses_log enable row level security;

drop policy if exists "Pengguna catat akses sendiri" on akses_log;
create policy "Pengguna catat akses sendiri"
  on akses_log for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Admin baca akses" on akses_log;
create policy "Admin baca akses"
  on akses_log for select
  to authenticated
  using (is_admin());

-- Ringkasan per pengguna (dipanggil dari server dengan service role).
create or replace function akses_ringkasan()
returns table (
  user_id uuid,
  jumlah_login bigint,
  jumlah_akses bigint,
  terakhir_akses timestamptz,
  terakhir_path text
)
language sql
stable
as $$
  select
    g.user_id,
    count(*) filter (where g.jenis = 'login'),
    count(*) filter (where g.jenis = 'halaman'),
    max(g.created_at) filter (where g.jenis = 'halaman'),
    (
      select h.path from akses_log h
      where h.user_id = g.user_id and h.jenis = 'halaman'
      order by h.created_at desc
      limit 1
    )
  from akses_log g
  group by g.user_id
$$;

revoke all on function akses_ringkasan() from public, anon, authenticated;
grant execute on function akses_ringkasan() to service_role;

notify pgrst, 'reload schema';
