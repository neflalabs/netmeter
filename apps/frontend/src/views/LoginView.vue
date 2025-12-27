<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogIn, Info } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
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
  <div class="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col relative overflow-hidden">
    <!-- Decorative background elements -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
    </div>

    <Header title="NetMeter" :show-back="true" back-to="/" class="z-10 bg-transparent border-none py-2" />

    <main class="flex-1 flex items-center justify-center container mx-auto px-4 py-6 z-10">
        <div class="w-full max-w-sm animate-in fade-in zoom-in duration-500">
            <Card class="border-border/40 shadow-2xl shadow-blue-500/5 backdrop-blur-sm bg-card/80 rounded-[2rem] overflow-hidden">
                <div class="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"></div>

                <CardHeader class="text-center pt-8 pb-4">
                    <div class="mx-auto w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20 rotate-3">
                        <LogIn class="w-7 h-7 text-white" />
                    </div>
                    <CardTitle class="text-2xl font-black tracking-tight text-foreground">Welcome Back</CardTitle>
                    <p class="text-xs text-muted-foreground mt-1">NetMeter Dashboard Login</p>
                </CardHeader>

                <CardContent class="px-7 pb-8 space-y-5">
                    <!-- Admin Only Note -->
                    <div class="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-2.5 items-center animate-in slide-in-from-top-2 duration-500">
                        <Info class="w-4 h-4 text-blue-500 shrink-0" />
                        <p class="text-[10px] text-blue-700/80 dark:text-blue-400/80 leading-tight font-bold tracking-tight">
                            Khusus Admin: Halaman ini hanya untuk manajemen sistem.
                        </p>
                    </div>

                    <div v-if="error" class="p-3 bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-500/20 animate-in shake duration-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                        {{ error }}
                    </div>

                    <div class="space-y-3.5">
                        <div class="space-y-1.5">
                            <Label for="username" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Username</Label>
                            <Input
                                id="username"
                                v-model="form.username"
                                placeholder="Masukkan username"
                                class="h-11 bg-secondary/30 border-border/50 rounded-xl px-4 focus:bg-background transition-all text-sm"
                            />
                        </div>

                        <div class="space-y-1.5">
                            <Label for="password" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Password</Label>
                            <Input
                                id="password"
                                v-model="form.password"
                                type="password"
                                placeholder="Masukkan password"
                                @keyup.enter="handleLogin"
                                class="h-11 bg-secondary/30 border-border/50 rounded-xl px-4 focus:bg-background transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div class="pt-2">
                        <Button
                            class="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-sm"
                            @click="handleLogin"
                            :disabled="isLoading"
                        >
                            <template v-if="isLoading">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Authenticating...
                            </template>
                            <span v-else>Login Ke Dashboard</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <p class="text-center text-[10px] text-muted-foreground mt-6 font-bold uppercase tracking-widest opacity-50">
                &copy; {{ new Date().getFullYear() }} NeflaLabs
            </p>
        </div>
    </main>
  </div>
</template>
