# 05. Special Features & Enhancements

Dokumentasi fitur-fitur lanjutan dan peningkatan sistem yang diimplementasikan di Netmeter.

---

## 1. Integrasi Pembayaran Midtrans (Snap)
Fitur pembayaran otomatis menggunakan Midtrans Snap API untuk pengalaman checkout yang mulus.

### Fitur Utama
- **Snap Token Caching**: `snapToken` di tabel `bills` di-cache selama 24 jam. Jika jumlah tagihan berubah, cache otomatis di-invalidate.
- **Webhook Verifikasi**: Signature Key diverifikasi dengan kombinasi `orderId`, `status_code`, `gross_amount`, dan Server Key.
- **Cancel Sync**: Pembatalan di aplikasi akan memicu panggilan ke API Midtrans untuk sinkronisasi status secara *real-time*.
- **Fraud Handling**: Mendukung status `accept` (aman), `challenge` (hold/menunggu review), dan `deny` (ditolak).

---

## 2. WhatsApp Notification Center
Sistem komunikasi otonom untuk menjaga hubungan dengan pelanggan.

### Logika Lanjutan
- **Quiet Hours**: Pesan tidak dikirim pukul 21:00 - 08:00. Pesan yang tertunda masuk antrean `HELD` dan dikirim otomatis besok pagi.
- **Weekend Logic**: Jika diaktifkan, notifikasi ditahan selama hari Sabtu/Minggu.
- **Duplicate Prevention**: Mengecek `whatsappLogs` berdasarkan `billId` dan `type` sebelum mengirim pesan baru.
- **WhatsApp Rate Limiting**: Implementasi jeda acak 2-5 detik di antara pengiriman pesan otomatis untuk mencegah pemblokiran.
- **Placeholder Templates**: Mendukung variabel dinamis seperti `{name}`, `{amount}`, `{month}`, `{year}`, `{link}`, dan `{method}`.

---

## 3. Arsitektur Pinia & SWR
Migrasi total dari state management lokal ke store terpusat untuk performa maksimal.

### Keunggulan
- **Stale-While-Revalidate (SWR)**: Menampilkan data lama (cache) segera, lalu mengupdate data terbaru di background. Menghilangkan "blank screen" saat loading.
- **Global API Interceptor**: Semua error API (401, 500) ditangkap secara terpusat oleh store dan memicu Toast otomatis.
- **Cross-Component Sync**: Update status di satu halaman (misal: bayar tagihan) akan otomatis memperbarui angka di Dashboard dan Laporan tanpa refresh manual.

---

## 4. PWA (Progressive Web App)
Mengubah website menjadi aplikasi mobile yang dapat diinstal.

### Detail Teknis
- **Manifest**: Konfigurasi `standalone` dengan ikon PNG 512px berkualitas tinggi.
- **Installation UI**: Floating card banner di pojok kanan bawah yang ramah pengguna.
- **Mobile Optimized**: Menghilangkan zoom otomatis pada input form dan mengoptimalkan status bar (iOS/Android).

---

## 5. Security & Maintenance
- **Soft Delete**: User yang "dihapus" tetap ada di database untuk keamanan audit, namun tidak muncul di list aktif. Tersedia fitur "Restore".
- **Database Backups**: Fitur download/restore file `.db` langsung dari panel admin.
- **Singleton Settings**: Menjamin konsistensi konfigurasi aplikasi di seluruh instance.
- **Production Dockerization**: Konfigurasi `multi-stage` build untuk frontend (Nginx) dan backend (Bun) agar performa optimal di lingkungan produksi.

