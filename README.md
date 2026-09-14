# CMS Materi Informatika Kelas 9

CMS sederhana untuk mengelola & membaca materi pelajaran Informatika kelas 9.
Guru (role `admin`) mengelola bab & materi lewat editor rich-text; siswa
login untuk membaca materi yang sudah diterbitkan.

Stack: Next.js (App Router) + Supabase (Auth, Postgres, Storage) + Tailwind CSS.

## Setup

### 1. Buat project Supabase baru

Buka [supabase.com](https://supabase.com), buat project baru (terpisah dari
project Supabase lain yang mungkin Anda punya). Catat **Project URL** dan
**anon public key** dari Settings -> API.

### 2. Jalankan skema database

Di Supabase Dashboard -> SQL Editor, jalankan berurutan:

1. [`supabase/schema.sql`](supabase/schema.sql) — tabel `profiles`, `bab`, `materi`, trigger, dan RLS.
2. [`supabase/materi-gambar-storage.sql`](supabase/materi-gambar-storage.sql) — bucket storage untuk gambar di konten materi.

### 3. Environment variable

Salin `.env.local.example` menjadi `.env.local`, isi dengan URL, anon key, dan
**service_role key** dari langkah 1 (semua ada di Settings -> API):

```bash
cp .env.local.example .env.local
```

`SUPABASE_SERVICE_ROLE_KEY` dipakai oleh halaman **Kelola User** (admin) untuk
membaca daftar akun & email dari `auth.users`, ganti role, dan hapus akun.
Key ini hanya dipakai di server (Route Handler), tidak pernah dikirim ke
browser — JANGAN pernah menambahkan prefix `NEXT_PUBLIC_` padanya, dan jangan
commit `.env.local` ke git.

### 4. Jalankan secara lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 5. Buat akun admin pertama

1. Buka `/signup`, daftar seperti siswa biasa (nama, email, kata sandi).
2. Di Supabase Dashboard -> SQL Editor, jalankan (ganti email sesuai akun yang baru didaftarkan):

   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = 'email-admin@contoh.com');
   ```

3. Login ulang — akun tersebut akan diarahkan ke `/admin/materi` untuk mengelola bab & materi.
   Siswa lain yang mendaftar lewat `/signup` otomatis mendapat role `siswa` dan hanya bisa membaca materi yang sudah diterbitkan.
   Setelah jadi admin, promosi/hapus akun lain bisa lewat menu **Kelola User** (tidak perlu SQL manual lagi).

## Deploy ke GitHub + Vercel

1. Push project ini ke repository GitHub baru.
2. Import repo tersebut di [Vercel](https://vercel.com/new).
3. Di pengaturan project Vercel, tambahkan environment variable `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` (nilai sama seperti `.env.local`).
4. Deploy.
