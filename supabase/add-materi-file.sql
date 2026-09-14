-- =====================================================================
-- Tambahan: lampiran file (PDF, HTML, dll) per materi, sebagai alternatif
-- atau pelengkap konten rich-text yang sudah ada.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table materi
  add column if not exists file_url text,
  add column if not exists file_name text,
  add column if not exists file_type text;
