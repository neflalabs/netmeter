# 06. Production Deployment Guide

Panduan untuk melakukan deployment Netmeter di lingkungan baru menggunakan Docker dan GitHub Actions.

---

## 1. Persiapan Infrastruktur
Sebelum melakukan deployment, pastikan server tujuan memiliki:
- **Docker & Docker Compose** (Versi terbaru).
- **Nginx Proxy Manager** (atau reverse proxy lain) yang berjalan di network Docker bernama `proxynpm`.
- Koneksi internet untuk menarik image dari GitHub Container Registry (GHCR).

---

## 2. Inisialisasi Lingkungan Baru
Ikuti langkah-langkah berikut untuk setup pertama kali:

### Langkah 1: Persiapan Folder
Buat folder proyek dan masuk ke dalamnya:
```bash
mkdir netmeter && cd netmeter
mkdir data
```

### Langkah 2: Konfigurasi Deployment
Salin file `compose.example.yaml` menjadi `compose.yaml` (atau `docker-compose.yml`):
```bash
# Download template
curl -O https://raw.githubusercontent.com/<user>/<repo>/main/compose.example.yaml
mv compose.example.yaml docker-compose.yml
```
> [!IMPORTANT]
> Edit file `docker-compose.yml` dan ganti `<github-username>` dengan username GitHub Anda yang berisi image hasil build.

### Langkah 3: Konfigurasi Environment
Buat file `.env` untuk menyimpan rahasia:
```bash
nano .env
```
Isi minimal:
```env
JWT_SECRET=GantiDenganStringAcakMinimal32Karakter
FRONTEND_URL=https://alamat-domain-anda.com
```

---

## 3. Menjalankan Aplikasi
Jalankan perintah berikut:
```bash
docker compose pull
docker compose up -d
```

Backend akan otomatis mendeteksi jika database belum ada dan menjalankan perintah:
`bun run --filter @netmeter/db migrate`
untuk membentuk tabel-tabel awal.

---

## 4. Troubleshooting
- **502 Bad Gateway**: Pastikan kontainer `netmeter-frontend` sudah join ke network `proxynpm`.
- **Database Error**: Cek permission folder `./data`, pastikan Docker memiliki akses tulis (write).
- **WhatsApp Not Connecting**: Pastikan folder `./apps/wa-bot/data` (opsional jika dipindah) memiliki akses tulis untuk menyimpan session.

---

## 5. Update Aplikasi
Untuk memperbarui ke versi terbaru setelah `git push` di GitHub selesai:
```bash
docker compose pull
docker compose up -d --remove-orphans
```
