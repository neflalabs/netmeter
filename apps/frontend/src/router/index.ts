
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import DashboardView from '../views/DashboardView.vue'
import SettingsView from '../views/SettingsView.vue' // Added import for SettingsView
import UsersView from '../views/UsersView.vue'
import BillsView from '../views/BillsView.vue'
import LoginView from '../views/LoginView.vue' // Direct import for LoginView


const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { layout: 'public', title: 'NetMeter' }
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: { layout: 'public', title: 'NetMeter', showBack: true, backTo: '/' }
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: DashboardView,
            meta: { layout: 'admin', requiresAuth: true, title: 'Admin Dashboard', subtitle: 'Ikhtisar aktivitas jaringan' }
        },
        {
            path: '/bills',
            name: 'bills',
            component: BillsView,
            meta: { layout: 'admin', requiresAuth: true, title: 'Kelola Tagihan', subtitle: 'Daftar semua tagihan pelanggan' }
        },
        {
            path: '/pay/:token',
            name: 'public-bill',
            component: () => import('../views/PublicBillView.vue'),
            meta: { layout: 'public', title: 'Pembayaran Tagihan' }
        },
        {
            path: '/stats',
            name: 'stats',
            component: () => import('../views/StatsView.vue'),
            meta: { layout: 'admin', requiresAuth: true, title: 'Statistik & Laporan', subtitle: 'Analisa performa bisnis Anda' }
        },
        {
            path: '/settings',
            name: 'settings',
            component: SettingsView,
            meta: { layout: 'admin', requiresAuth: true, title: 'Pengaturan Sistem', subtitle: 'Konfigurasi aplikasi dan layanan' }
        },
        {
            path: '/announcement',
            name: 'announcement',
            component: () => import('../views/AnnouncementView.vue'),
            meta: { layout: 'admin', requiresAuth: true, title: 'Pengumuman', subtitle: 'Kelola pengumuman di halaman utama' }
        },
        {
            path: '/users',
            name: 'users',
            component: UsersView,
            meta: { layout: 'admin', requiresAuth: true, title: 'Manajemen User', subtitle: 'Kelola database pelanggan Anda' }
        },
        {
            path: '/users/new',
            name: 'create-user',
            component: () => import('@/components/users/CreateUserView.vue'),
            meta: { layout: 'admin', requiresAuth: true, title: 'Tambah User', subtitle: 'Daftarkan pelanggan baru', showBack: true, backTo: '/users' }
        },
        {
            path: '/users/:id/edit',
            name: 'edit-user',
            component: () => import('../components/users/EditUserView.vue'),
            meta: { layout: 'admin', requiresAuth: true, title: 'Edit User', subtitle: 'Ubah informasi pelanggan', showBack: true, backTo: '/users' }
        },
    ]
})

import { useAuthStore } from '@/stores/auth'

// Navigation Guard
router.beforeEach((to, _from, next) => {
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        next('/login')
    } else if (to.path === '/login' && auth.isAuthenticated) {
        next('/dashboard')
    } else {
        next()
    }
})

export default router
