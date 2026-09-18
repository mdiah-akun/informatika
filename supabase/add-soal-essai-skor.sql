-- =====================================================================
-- Skor maksimal per soal essai (ditentukan admin), dan hasil koreksi
-- otomatis oleh AI tersimpan di soal_essai_attempt: skor per soal
-- (jsonb, keyed by soal_essai id), skor_total (0-100, dinormalisasi
-- dari skor per soal terhadap skor_maksimal masing-masing), dan waktu
-- terakhir dikoreksi.
-- Jalankan di Supabase -> SQL Editor.
-- =====================================================================

alter table soal_essai add column if not exists skor_maksimal numeric not null default 100;

alter table soal_essai_attempt add column if not exists skor jsonb not null default '{}'::jsonb;
alter table soal_essai_attempt add column if not exists skor_total numeric;
alter table soal_essai_attempt add column if not exists dikoreksi_at timestamptz;
