<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogIn } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const isLoading = ref(false)
const error = ref('')

const form = ref({
    username: '',
    password: ''
})

const handleLogin = async () => {
    isLoading.value = true
    error.value = ''

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(form.value)
        })

        if (!res.ok) {
            throw new Error('Username atau Password salah')
        }

        const data = await res.json()
        
        // Use Pinia store to set token (reactively)
        auth.setToken(data.token)
        localStorage.setItem('username', form.value.username)
        
        router.push('/dashboard')
    } catch (e: any) {
        error.value = e.message || 'Terjadi kesalahan saat login'
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-background pb-20">
    <Header title="Login netmeter" :show-back="true" back-to="/" />

    <main class="container mx-auto px-4 py-12 max-w-md">
        <Card>
            <CardHeader class="text-center">
                <div class="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                    <LogIn class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle class="text-xl">Welcome Back</CardTitle>
                <p class="text-sm text-slate-500 dark:text-slate-400">Masuk untuk mengelola Netmeter</p>
            </CardHeader>
            <CardContent class="space-y-4">
                <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-800">
                    {{ error }}
                </div>

                <div class="space-y-2">
                    <Label for="username">Username</Label>
                    <Input id="username" v-model="form.username" placeholder="Masukkan username" />
                </div>
                
                <div class="space-y-2">
                    <Label for="password">Password</Label>
                    <Input id="password" v-model="form.password" type="password" placeholder="Masukkan password" @keyup.enter="handleLogin" />
                </div>

                <div class="pt-2">
                    <Button class="w-full" @click="handleLogin" :disabled="isLoading">
                        {{ isLoading ? 'Checking...' : 'Login' }}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </main>
    <Footer />
  </div>
</template>
