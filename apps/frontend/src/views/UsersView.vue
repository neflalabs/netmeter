<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Search, Users, Edit2, Trash2, RotateCcw } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import StatsCard from '@/components/StatsCard.vue'
import { useFormatters } from '@/composables/useFormatters'
import type { User } from '@/types'
import UserDetailSheet from '@/components/users/UserDetailSheet.vue'
import { useToast } from '@/composables/useToast'
import { useUserStore } from '@/stores/user'
import { useConfirm } from '@/composables/useConfirm'

const { formatDateOnly } = useFormatters()
const { toast } = useToast()
const { confirm } = useConfirm()
const userStore = useUserStore()

const isLoading = computed(() => userStore.isFetching)
const searchQuery = ref('')
const selectedUser = ref<User | null>(null)
const isDetailOpen = ref(false)

const filteredUsers = computed(() => {
    if (!searchQuery.value) return userStore.users
    const q = searchQuery.value.toLowerCase()
    return userStore.users.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.whatsapp?.toLowerCase().includes(q)
    )
})

const openUserDetail = (user: User) => {
    selectedUser.value = user
    isDetailOpen.value = true
}

const handleDelete = async (user: User) => {
    const confirmed = await confirm({
        title: 'Konfirmasi Hapus',
        message: `Yakin ingin menghapus ${user.name}?`,
        confirmText: 'Ya, Hapus',
        variant: 'destructive'
    })
    
    if (!confirmed) return
    
    try {
        await userStore.deleteUser(user.id)
        toast({
            title: 'Berhasil',
            description: 'User berhasil dihapus'
        })
    } catch (e) {
        console.error('Failed to delete user', e)
    }
}

const handleRestore = async (user: User) => {
    try {
        await userStore.restoreUser(user.id)
        toast({
            title: 'Berhasil',
            description: 'User berhasil dipulihkan'
        })
    } catch (e) {
        console.error('Failed to restore user', e)
    }
}

onMounted(() => {
    userStore.fetchUsers()
})
</script>

<template>
  <div class="min-h-screen bg-background pb-20 md:pb-6 flex">
    <!-- Desktop Sidebar -->
    <AdminSidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col md:ml-64 transition-all duration-300 min-w-0 overflow-x-hidden">
        <!-- Header -->
        <Header 
            title="Daftar Pengguna" 
            subtitle="Kelola pelanggan WiFi"
            :show-back="true"
        >
            <template #actions>
                <Button size="sm" @click="$router.push('/users/new')">
                    <Plus class="w-4 h-4 mr-1" />
                    Tambah
                </Button>
            </template>
        </Header>

        <main class="container mx-auto px-4 py-6 md:max-w-4xl space-y-4 w-full">
            <!-- Stats -->
            <div class="max-w-sm">
                <StatsCard 
                    title="Total User Aktif" 
                    :value="userStore.users.length" 
                    :icon="Users" 
                    variant="primary"
                />
            </div>

            <!-- Search & User List -->
            <Card>
                <CardHeader class="pb-3 px-4 pt-4 border-b border-border">
                    <div class="flex items-center gap-2">
                        <Search class="w-4 h-4 text-muted-foreground" />
                        <input 
                            v-model="searchQuery"
                            type="text" 
                            placeholder="Cari pengguna..." 
                            class="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
                        />
                    </div>
                </CardHeader>
                <CardContent class="p-0">
                    <div v-if="isLoading" class="p-8 text-center text-muted-foreground">
                        <div class="animate-pulse">Memuat data...</div>
                    </div>
                    <div v-else-if="filteredUsers.length === 0" class="p-8 text-center text-muted-foreground">
                        <Users class="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                        <p class="font-medium">Belum ada pengguna</p>
                        <p class="text-xs mt-1">Klik tombol "Tambah" untuk menambah user baru</p>
                    </div>
                    <div v-else class="divide-y divide-border">
                        <div 
                            v-for="user in filteredUsers" 
                            :key="user.id" 
                            class="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                            @click="openUserDetail(user)"
                        >
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {{ user.name.charAt(0).toUpperCase() }}
                                </div>
                                <div>
                                    <div class="font-medium text-foreground">{{ user.name }}</div>
                                    <div class="text-xs text-muted-foreground">{{ user.whatsapp || '-' }}</div>
                                    <div v-if="user.joinedAt" class="text-[10px] text-muted-foreground">
                                        Bergabung: {{ formatDateOnly(user.joinedAt) }}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span 
                                    v-if="!user.deletedAt"
                                    class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                    :class="user.status === 'ACTIVE' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'"
                                >
                                    {{ user.status }}
                                </span>
                                <span 
                                    v-else
                                    class="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-900/50"
                                >
                                    DELETED
                                </span>
                                <Button 
                                    v-if="!user.deletedAt"
                                    variant="ghost" 
                                    size="icon" 
                                    class="h-8 w-8 text-muted-foreground hover:text-primary" 
                                    @click.stop="$router.push(`/users/${user.id}/edit`)"
                                >
                                    <Edit2 class="w-4 h-4" />
                                </Button>
                                <Button 
                                    v-if="!user.deletedAt"
                                    variant="ghost" 
                                    size="icon" 
                                    class="h-8 w-8 text-muted-foreground hover:text-destructive" 
                                    @click.stop="handleDelete(user)"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </Button>
                                <Button 
                                    v-else
                                    variant="ghost" 
                                    size="icon" 
                                    class="h-8 w-8 text-muted-foreground hover:text-green-600" 
                                    @click.stop="handleRestore(user)"
                                >
                                    <RotateCcw class="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>

        <Footer />
    </div>

    <UserDetailSheet 
        :is-open="isDetailOpen" 
        :user="selectedUser"
        @close="isDetailOpen = false"
    />
  </div>
</template>
