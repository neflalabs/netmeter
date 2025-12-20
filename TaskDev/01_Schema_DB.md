# Database Schema Documentation

> **Tech Stack:** SQLite + Drizzle ORM
> **Location:** `packages/db/src/schema.ts`

## 1. Users Table
Menyimpan data pelanggan internet.

| Column              | Type         | Description                     |
| :------------------ | :----------- | :------------------------------ |
| `id`                | Integer (PK) | Auto-increment ID               |
| `name`              | Text         | Nama pelanggan                  |
| `whatsapp`          | Text         | Nomor WA (628xxx)               |
| `status`            | Text         | 'ACTIVE' or 'INACTIVE'          |
| `paymentPreference` | Text         | 'MANUAL' or 'AUTO'              |
| `address`           | Text         | Alamat pemasangan               |
| `pppoeUsername`     | Text         | Username PPPoE (Teknis)         |
| `deviceModel`       | Text         | Model alat yang dipinjamkan     |
| `notes`             | Text         | Catatan tambahan                |
| `joinedAt`          | Timestamp    | Tanggal bergabung               |
| `firstConnectedAt`  | Timestamp    | Tanggal pertama kali konek      |
| `deletedAt`         | Timestamp    | Soft delete timestamp           |
| `dueDay`            | Integer      | Override globalDueDay           |
| `reminderInterval`  | Integer      | Override globalReminderInterval |
| `reminderEnabled`   | Boolean      | Status reminder per user        |

## 2. Bills Table
Tagihan bulanan yang digenerate sistem.

| Column            | Type         | Description                   |
| :---------------- | :----------- | :---------------------------- |
| `id`              | Integer (PK) | Auto-increment ID             |
| `userId`          | Integer (FK) | Relasi ke Users               |
| `month`           | Integer      | 1-12                          |
| `year`            | Integer      | 2024, 2025, dst               |
| `amount`          | Integer      | Nominal tagihan saat generate |
| `status`          | Text         | 'UNPAID' or 'PAID'            |
| `paymentToken`    | Text         | Token unik untuk link public  |
| `snapToken`       | Text         | Cache token Midtrans Snap     |
| `snapTokenExpiry` | Timestamp    | Expiry cache token            |
| `snapAmount`      | Integer      | Nominal saat request Snap     |
| `paidAt`          | Timestamp    | Tanggal pembayaran lunas      |
| `createdAt`       | Timestamp    | Tanggal pembuatan data        |

## 3. Payments Table
Buku besar riwayat transaksi pembayaran.

| Column          | Type         | Description                           |
| :-------------- | :----------- | :------------------------------------ |
| `id`            | Integer (PK) | Auto-increment ID                     |
| `billId`        | Integer (FK) | Relasi ke Bills                       |
| `amount`        | Integer      | Jumlah yang dibayarkan                |
| `method`        | Text         | 'CASH', 'MANUAL_TRANSFER', 'MIDTRANS' |
| `transactionId` | Text         | ID Transaksi dari Midtrans            |
| `paymentType`   | Text         | gopay, bank_transfer, dll             |
| `issuer`        | Text         | bca, bni, shoopepay, dll              |
| `gatewayStatus` | Text         | settlement, pending, cancel, dll      |
| `externalId`    | Text         | Order ID lokal (BILL-ID)              |
| `currency`      | Text         | Default 'IDR'                         |
| `proofUrl`      | Text         | URL bukti bayar (jika ada)            |
| `status`        | Text         | 'PENDING', 'VERIFIED', 'REJECTED'     |
| `paidAt`        | Timestamp    | Tanggal transaksi terjadi             |

## 4. Settings Table
Konfigurasi global aplikasi (Singleton).

| Column                     | Type         | Description                       |
| :------------------------- | :----------- | :-------------------------------- |
| `singleton`                | Integer (PK) | Selalu bernilai 1                 |
| `monthlyFee`               | Integer      | Harga paket standar               |
| `adminPhoneNumber`         | Text         | Nomor WA Admin                    |
| `appTitle`                 | Text         | Judul Aplikasi                    |
| `appSubtitle`              | Text         | Subjudul Aplikasi                 |
| `appUrl`                   | Text         | Base URL untuk Webhook/Notifikasi |
| `listingPerHome`           | Integer      | Jumlah list di homepage           |
| `waEnabled`                | Boolean      | Status aktifasi WhatsApp          |
| `autoNotifyNewBill`        | Boolean      | Kirim notifikasi tagihan baru     |
| `autoNotifyPaymentSuccess` | Boolean      | Kirim kuitansi WA otomatis        |
| `autoReminderEnabled`      | Boolean      | Kirim pengingat tagihan           |
| `reminderTime`             | Text         | Jam kirim Pengingat (HH:mm)       |
| `autoBillTime`             | Text         | Jam kirim Tagihan Baru (HH:mm)    |
| `quietHoursStart`          | Text         | Jam mulai Quiet Hours             |
| `quietHoursEnd`            | Text         | Jam selesai Quiet Hours           |
| `quietHoursWeekend`        | Boolean      | Quiet Hours di akhir pekan        |
| `manualPaymentEnabled`     | Boolean      | Pembayaran Manual Aktif           |
| `qrisPaymentEnabled`       | Boolean      | Pembayaran QRIS Aktif             |
| `qrisStaticImage`          | Text         | URL gambar QRIS statis            |
| `midtransEnabled`          | Boolean      | Status aktifasi Midtrans          |
| `midtransEnvironment`      | Text         | 'sandbox' or 'production'         |
| `billTemplate`             | Text         | Template Pesan Tagihan Baru       |
| `paymentTemplate`          | Text         | Template Pesan Kuitansi           |
| `reminderTemplate`         | Text         | Template Pesan Pengingat          |

## 5. WhatsApp Logs Table
Log pengiriman pesan WhatsApp.

| Column        | Type         | Description                    |
| :------------ | :----------- | :----------------------------- |
| `id`          | Integer (PK) | Auto-increment ID              |
| `recipient`   | Text         | Nomor HP tujuan                |
| `userId`      | Integer (FK) | Relasi ke Users                |
| `billId`      | Integer (FK) | Relasi ke Bills                |
| `message`     | Text         | Isi pesan                      |
| `type`        | Text         | BILL, RECEIPT, REMINDER, OTHER |
| `status`      | Text         | SENT, DELIVERED, READ, FAILED  |
| `waMessageId` | Text         | ID unik dari whatsmeow         |
| `createdAt`   | Timestamp    | Waktu pengiriman               |
