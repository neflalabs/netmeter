# Business Logic & Rules

Dokumen ini mendefinisikan logika inti aplikasi Netmeter.

## 1. Siklus Penagihan (Billing Cycle)
- **Generasi Tagihan**: Admin memicu `POST /bills/generate`. Sistem akan mencari semua user dengan status `ACTIVE` yang belum memiliki tagihan di bulan/tahun berjalan.
- **Harga**: Nominal diambil dari `monthlyFee` di tabel `settings` saat tagihan dibuat.
- **Jatuh Tempo**: Default adalah tanggal 10 tiap bulan (`globalDueDay`), namun bisa di-override per user (`dueDay`).

## 2. Sistem Pembayaran
- **Metode Pembayaran**:
    - **CASH**: Admin menandai lunas manual.
    - **MANUAL_TRANSFER**: User upload bukti/konfirmasi ke admin.
    - **MIDTRANS**: Pembayaran otomatis via Gateway (Snap).
- **Status Tagihan**:
    - `UNPAID`: Default saat dibuat.
    - `PAID`: Jika sudah ada pembayaran `VERIFIED`.
- **Validasi Midtrans**: Signature Key diverifikasi dengan SHA512. Jika status `settlement` atau `capture` (accept), tagihan otomatis menjadi `PAID`.

## 3. Notifikasi WhatsApp
Logika pengiriman dikelola oleh `NotificationService` dengan aturan:
- **Quiet Hours**: Pesan tidak dikirim jika waktu saat ini berada di antara `quietHoursStart` dan `quietHoursEnd` (Default: 21:00 - 08:00).
- **Weekend Policy**: Jika `quietHoursWeekend` aktif, pesan tidak dikirim di hari Sabtu/Minggu (menunggu Senin pagi).
- **Held Queue**: Pesan yang ditahan akan dikirim otomatis oleh scheduler sistem saat jam kerja dimulai.
- **Auto-Retry**: Jika gagal, log akan tercatat sebagai `FAILED`.

## 4. Keamanan & Akses
- **Authentication**: Menggunakan JWT Token. Admin harus login untuk mengakses dashboard.
- **Public Access**: Link pembayaran (`/p/:token`) bersifat publik namun hanya menampilkan data terbatas (nama, jumlah, status) tanpa perlu login.
- **Soft Delete**: User yang dihapus tidak benar-benar hilang dari database (`deletedAt` diisi), memungkinan untuk restore jika dibutuhkan.

## 5. Sinkronisasi Data (Pinia)
- **SWR (Stale-While-Revalidate)**: Frontend menampilkan data cache terlebih dahulu, lalu melakukan update di background untuk memastikan UI selalu responsif.
- **Store Driven**: Seluruh aksi (bayar, hapus, tambah) harus melalui Pinia Store agar state di seluruh komponen tetap sinkron.
