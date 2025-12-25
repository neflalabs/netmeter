import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.ico', 'logo.svg', 'icon-192.png', 'icon-512.png'],
            devOptions: {
                enabled: true,
                type: 'classic'
            },
            manifest: {
                name: 'Netmeter Billing',
                short_name: 'Netmeter',
                description: 'Aplikasi Manajemen Tagihan WiFi & Internet',
                theme_color: '#2563eb',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: 'icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        host: true,
        allowedHosts: true,
        proxy: {
            '/api': {
                target: 'http://backend:3000',
                changeOrigin: true
            }
        }
    }
});
