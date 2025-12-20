# UI/UX Design Guidelines

## Philosophy
- **Mobile First**: Desain responsif, dioptimalkan untuk akses cepat via smartphone.
- **Premium Aesthetics**: Menggunakan Dark Mode (Zinc style), Glassmorphism (blur backgrounds), dan Shadcn-Vue.
- **Reactivity**: Feedback instan via Toasts (Sonner) dan reactive state (Pinia).

## 1. Landing Page (`/`)
- Menampilkan status jaringan (Online/Offline).
- Daftar tagihan bulan berjalan (Dashboard publik terbatas).
- Tombol login admin yang intuitif.

## 2. Admin Dashboard (`/dashboard`)
- **Stats Card Grid**:
    - Total Pendapatan Bulan Ini.
    - Total Tagihan Pending.
    - Status Koneksi WhatsApp.
- **Interactive Charts**: Daily income chart dan distribusi hari pembayaran.
- **Real-time Logs**: Menampilkan aktivitas WhatsApp terbaru.

## 3. User Management (`/users`)
- Tabbed view: `Semua` | `Dihapus`.
- List item dengan indikator status warna dan inisial avatar.
- Form detail dalam bentuk Sliding Sheet untuk pengalaman mobile yang mulus.

## 4. Settings Interface (`/settings`)
- **Category Tabs**:
    - **WhatsApp Bot**: QR Code, status koneksi, dan log.
    - **Penagihan**: Monthly fee dan template pesan.
    - **Payment Gateway**: Konfigurasi Midtrans & simulasi.
    - **Backup**: Database management.

## 5. PWA (Progressive Web App)
- **Install Banner**: Floating card di pojok kanan bawah untuk instalasi instan.
- **Branding**: Ikon 512px PNG yang konsisten untuk Home Screen.
- **Display**: Fullscreen standalone mode tanpa elemen browser chrome.
