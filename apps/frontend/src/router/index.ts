
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
            component: HomeView
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: DashboardView,
            meta: { requiresAuth: true }
        },
        {
            path: '/bills',
            name: 'bills',
            component: BillsView,
            meta: { requiresAuth: true }
        },
        {
            path: '/pay/:token',
            name: 'public-bill',
            component: () => import('../views/PublicBillView.vue'),
            meta: { layout: 'public' }
        },
        {
            path: '/stats',
            name: 'stats',
            component: () => import('../views/StatsView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/settings', // Added new route for settings
            name: 'settings',
            component: SettingsView,
            meta: { requiresAuth: true }
        },
        {
            path: '/announcement',
            name: 'announcement',
            component: () => import('../views/AnnouncementView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/users',
            name: 'users',
            component: UsersView,
            meta: { requiresAuth: true }
        },
        {
            path: '/users/new',
            name: 'create-user',
            component: () => import('@/components/users/CreateUserView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/users/:id/edit',
            name: 'edit-user',
            component: () => import('../components/users/EditUserView.vue'),
            meta: { requiresAuth: true }
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
