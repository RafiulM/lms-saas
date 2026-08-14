# KelasHub — LMS Sekolah

SaaS LMS untuk sekolah: jadwal pelajaran, input nilai, tugas & pengumpulan, pengumuman, dan langganan. Backend dibangun dengan **Next.js (App Router) + Drizzle ORM + SQLite + Better Auth** sesuai `lms-sekolah-PRD.md`.

## Struktur

```
db/
  schema.ts        — seluruh tabel (schools, users, classes, class_members,
                     subjects, schedules, assignments, submissions, grades,
                     announcements, subscriptions, school_stats) + tabel inti Better Auth
  index.ts         — koneksi SQLite (data/lms.db) + client Drizzle
  seed.ts          — data demo meniru mock frontend
drizzle/           — migrasi SQL hasil drizzle-kit
lib/
  auth.ts          — konfigurasi Better Auth (drizzle adapter, admin plugin, nextCookies)
  auth-client.ts   — client Better Auth untuk komponen klien
  auth-helpers.ts  — requireSession / requireRole / getSchoolOf
  actions/         — server actions per fitur:
    school.ts          — daftar sekolah (buat sekolah + admin), ubah pengaturan
    users.ts           — buat akun (manual/bulk dari Excel), hapus, daftar pengguna
    classes.ts         — CRUD kelas & keanggotaan murid
    subjects.ts        — CRUD mata pelajaran
    schedules.ts       — jadwal mingguan (grid 7 hari)
    assignments.ts     — kirim tugas, kumpulkan tugas, nilai & umpan balik
    grades.ts          — input nilai (tugas/ulangan), rekap, ekspor CSV
    announcements.ts   — CRUD pengumuman
    subscription.ts    — paket, checkout Mayar.id, status langganan
    dashboard.ts       — data Beranda (jadwal hari ini, tugas mendesak, pengumuman)
app/api/
  auth/[...all]/    — endpoint Better Auth (login, logout, register, sesi)
  upload/           — unggah berkas tugas/jawaban (maks. 10 MB, ke public/uploads)
```

## Menjalankan

```bash
npm install
cp .env.example .env          # isi BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run db:generate           # buat migrasi dari schema
npm run db:migrate            # terapkan migrasi ke data/lms.db
npm run db:seed               # isi data demo (opsional)
npm run db:seed:mayar         # buat payment request di Mayar.id (opsional, butuh MAYAR_API_TOKEN)
npm run dev
```

## Akun demo (setelah `db:seed`, password `password123`)

| Peran  | Email                    |
|--------|--------------------------|
| Admin  | admin@smkn5bdg.sch.id    |
| Guru   | nabila@smkn5bdg.sch.id   |
| Murid  | alya@smkn5bdg.sch.id     |

## Model data (inti)

- **users** — akun Better Auth + `schoolId` & `role` (`admin` / `teacher` / `student`). Role tidak bisa diatur lewat sign-up (input `false`); guru & murid dibuat admin lewat `admin()` plugin.
- **schools** — profil sekolah; registrasi membuat sekolah + user admin sekaligus.
- **class_members** — pemisahan murid dari guru untuk perhitungan langganan.
- **grades** — terhubung ke tugas lewat `assignmentId`, atau berdiri sendiri (ulangan).
- **school_stats** — jumlah murid & guru aktif (dipelihara otomatis saat CRUD pengguna) untuk perhitungan paket.

## Alur autentikasi

- Login/logout via Better Auth (`/api/auth/*`), sesi cookie diatur otomatis oleh plugin `nextCookies()`.
- Di server component/action: `auth.api.getSession()` + helper `requireRole()`.
- Di client: `useCurrentUser()` (lib/auth-client.ts) — aman untuk SSR/prerender.
- Registrasi sekolah: server action `registerSchool()` membuat baris sekolah, lalu `signUpEmail`, lalu set role `admin` + `schoolId` — role tidak pernah bisa dipilih oleh pemanggil langsung.

## Integrasi Mayar.id (langganan)

- `createSubscriptionCheckout(plan, billing)` memanggil [Payment Request API](https://docs.mayar.id/api-reference/reqpayment/create) (`POST /hl/v1/payment/create`) dengan `MAYAR_API_TOKEN`, menyimpan `mayarTransactionId` + link checkout, dan mencatat baris `payments` berstatus `pending`. Billing `yearly` = harga × 12 × 0,8.
- Webhook `POST /api/mayar/webhook` (daftarkan di dashboard Mayar, event `payment.received`) menandai langganan `active` dan pembayaran `paid`.
- Seed pembayaran: `db/seed.ts` mengisi riwayat pembayaran demo (3 lunas + 1 pending); `db/seed:mayar` membuat payment request sungguhan di Mayar untuk Starter bulanan, Growth bulanan, dan Growth tahunan.

## Integrasi frontend

Semua halaman utama sudah terhubung ke backend. Saat belum login, halaman menampilkan data demo (mock) agar tetap bisa dijelajahi; setelah login, data asli dari database ditampilkan:

| Halaman | Data backend |
|---|---|
| Beranda | `getDashboard()` — jadwal hari ini, tugas mendesak, pengumuman, metrik murid/guru |
| Tugas & Pengumpulan | `listAssignments()` / `listStudentAssignments()` — status, jumlah pengumpulan, tenggat |
| Detail Tugas | `getAssignment()`, `listSubmissions()` — murid bisa unggah jawaban (`/api/upload` + `submitAssignment`), guru bisa nilai + umpan balik (`gradeSubmission`) |
| Buat Tugas (modal) | `createAssignment()` dengan kelas & mapel dari database |
| Jadwal Pelajaran | `getScheduleGrid()` — grid mingguan; murid hanya melihat kelasnya |
| Input Nilai | `getGradeRecap()`, `getClassRoster()`, `bulkInputGrades()`, `exportGradesCsv()` (unduh CSV), murid melihat `getMyGrades()` |
| Pengguna & Kelas | `listUsers()`, `createUsers()` (manual atau tempel Excel via `parseUserLines`), `deleteUser()` |
| Detail Kelas / Murid | `getClassDetailData()`, `getStudentDetail()` |
| Pengumuman | `listAnnouncements()`, `createAnnouncement()`, `deleteAnnouncement()` |
| Langganan & Pricing | `getPlansWithStats()`, `getSubscription()`, `createSubscriptionCheckout()` (Mayar.id) |
| Pengaturan & Profil | `getSchoolProfile()` / `updateSchool()`, sesi user nyata |

Alur autentikasi: login/daftar di `/masuk` menggunakan Better Auth; komponen header menampilkan nama & peran user nyata serta tombol logout.

## Catatan

- File unggahan disimpan ke `public/uploads` (dalam produksi ganti ke S3-compatible storage).
- Semua halaman memuat data nyata dari server action dan menampilkan kerangka pemuatan (`PageLoading`) hingga respons server tiba; tidak ada lagi data mock/placeholder.
- Server action memanggil Better Auth dengan `headers: await headers()` (lihat `getRequestHeaders()` di `lib/auth-helpers.ts`) — wajib, karena `nextCookies()` tidak menyuntikkan request headers ke pemanggilan `auth.api.*` langsung.
- Setelah `npm run build`, restart server lama (`next start`/`next dev`) — server yang berjalan dari build sebelumnya akan menyajikan chunk JS yang sudah dihapus (404 → React tidak ter-hydrate → form submit tidak berfungsi).
