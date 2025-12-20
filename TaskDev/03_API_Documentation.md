# API Documentation

Base URL: `/api`

## Authentication
| Method | Endpoint      | Description | Body                     |
| :----- | :------------ | :---------- | :----------------------- |
| POST   | `/auth/login` | Login Admin | `{ username, password }` |

## Bills
| Method | Endpoint                    | Description                   | Body                                                  |
| :----- | :-------------------------- | :---------------------------- | :---------------------------------------------------- |
| GET    | `/bills`                    | List semua tagihan            | `?userId=...`                                         |
| POST   | `/bills/generate`           | Generate tagihan massal       | -                                                     |
| PATCH  | `/bills/:id/pay`            | Tandai tagihan lunas manual   | `{ paidAt: Date, method: 'CASH'\|'MANUAL_TRANSFER' }` |
| POST   | `/bills/:id/notify`         | Kirim notifikasi tagihan (WA) | -                                                     |
| POST   | `/bills/:id/payment-notify` | Kirim kuitansi lunas (WA)     | -                                                     |

## Users
| Method | Endpoint             | Description               | Body                               |
| :----- | :------------------- | :------------------------ | :--------------------------------- |
| GET    | `/users`             | List semua user           | -                                  |
| GET    | `/users/:id`         | Detail user               | -                                  |
| POST   | `/users`             | Tambah user baru          | `{ name, whatsapp, address, ... }` |
| PUT    | `/users/:id`         | Edit user                 | `{ name, whatsapp, status, ... }`  |
| DELETE | `/users/:id`         | Soft delete user          | -                                  |
| POST   | `/users/:id/restore` | Restore user yang dihapus | -                                  |

## Reports & Stats
| Method | Endpoint                 | Description                | Query Params                     |
| :----- | :----------------------- | :------------------------- | :------------------------------- |
| GET    | `/reports/financial`     | Summary pendapatan & chart | `startDate`, `endDate`, `method` |
| GET    | `/reports/payment-dates` | Distribusi tanggal bayar   | -                                |

## Settings
| Method | Endpoint    | Description                   | Body                            |
| :----- | :---------- | :---------------------------- | :------------------------------ |
| GET    | `/settings` | Ambil konfigurasi (Singleton) | -                               |
| PUT    | `/settings` | Update konfigurasi            | `{ monthlyFee, appTitle, ... }` |

## WhatsApp
| Method | Endpoint           | Description                | Body              |
| :----- | :----------------- | :------------------------- | :---------------- |
| GET    | `/whatsapp/status` | Cek koneksi bot            | -                 |
| GET    | `/whatsapp/qr`     | Ambil QR Code login        | -                 |
| POST   | `/whatsapp/login`  | Inisiasi login WhatsMeow   | -                 |
| POST   | `/whatsapp/logout` | Disconnect bot             | -                 |
| POST   | `/whatsapp/sync`   | Sync status pesan terakhir | -                 |
| GET    | `/whatsapp/logs`   | List log pengiriman WA     | `?page=1&limit=5` |

## Payments (Midtrans)
| Method | Endpoint                  | Description               | Body               |
| :----- | :------------------------ | :------------------------ | :----------------- |
| POST   | `/payment/snap/:billId`   | Ambil Snap Token Midtrans | -                  |
| POST   | `/payment/notification`   | Webhook dari Midtrans     | (Midtrans Payload) |
| POST   | `/payment/cancel/:billId` | Batalkan transaksi Snap   | -                  |

## Backup & System
| Method | Endpoint           | Description             |
| :----- | :----------------- | :---------------------- |
| GET    | `/backup/download` | Download database `.db` |
| POST   | `/backup/restore`  | Upload & restore db     |
