<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, UserPlus, Trash2, Edit, MoreHorizontal, Users, RefreshCcw } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useFormatters } from '@/composables/useFormatters'

// UI Components
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import DropdownMenu from '@/components/ui/DropdownMenu.vue'
import DropdownMenuTrigger from '@/components/ui/DropdownMenuTrigger.vue'
import DropdownMenuContent from '@/components/ui/DropdownMenuContent.vue'
import DropdownMenuItem from '@/components/ui/DropdownMenuItem.vue'

const router = useRouter()
const userStore = useUserStore()
const { toast } = useToast()
const { confirm } = useConfirm()
const { formatCurrency } = useFormatters()

const searchQuery = ref('')
const filterStatus = ref('all')
const isProcessing = ref<number | null>(null)

const filteredUsers = computed(() => {
    let users = userStore.users;

    if (filterStatus.value !== 'all') {
        users = users.filter(u => u.status === filterStatus.value);
    }

    if (!searchQuery.value) return users;
    const q = searchQuery.value.toLowerCase();
    return users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.whatsapp?.toLowerCase().includes(q) ||
        u.pppoeUsername?.toLowerCase().includes(q)
    );
});

const handleDelete = async (userId: number) => {
    const user = userStore.users.find(u => u.id === userId)
    if (!user) return

    const confirmed = await confirm({
        title: 'Konfirmasi Hapus',
        message: `Yakin ingin menghapus ${user.pppoeUsername || user.name}?`,
        confirmText: 'Ya, Hapus',
        variant: 'destructive'
    })

    if (!confirmed) return

    try {
        isProcessing.value = userId;
        await userStore.deleteUser(userId)
        toast({
            title: 'Berhasil',
            description: 'User berhasil dihapus'
        })
    } catch (e) {
        console.error('Failed to delete user', e)
        toast({
            title: 'Gagal',
            description: 'Gagal menghapus user',
            variant: 'destructive'
        })
    } finally {
        isProcessing.value = null;
    }
}

onMounted(() => {
    userStore.fetchUsers()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-sm">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
                v-model="searchQuery"
                placeholder="Cari nama, whatsapp, atau username..."
                class="pl-9"
            />
        </div>
        
        <div class="flex items-center gap-2">
            <Button @click="router.push('/users/new')" class="gap-2">
                <UserPlus class="w-4 h-4" />
                Tambah User
            </Button>
            <Button @click="userStore.fetchUsers" variant="secondary" size="icon" :disabled="userStore.isFetching">
                <RefreshCcw class="w-4 h-4" :class="{ 'animate-spin': userStore.isFetching }" />
            </Button>
        </div>
    </div>

    <!-- Users Table -->
    <Card>
        <CardContent class="p-0">
            <div v-if="userStore.isFetching && userStore.users.length === 0" class="p-8 text-center text-muted-foreground">
                <div class="animate-pulse">Memuat data user...</div>
            </div>
            <div v-else-if="filteredUsers.length === 0" class="p-8 text-center text-muted-foreground">
                <Users class="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Tidak ada data user ditemukan</p>
            </div>
            <div v-else class="divide-y divide-border">
                <div v-for="user in filteredUsers" :key="user.id" class="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-secondary/50 transition-colors gap-3">
                    <div class="flex items-center gap-4">
                        <div 
                            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                            :class="user.status === 'ACTIVE' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' : 'bg-gradient-to-br from-gray-500 to-slate-500'"
                        >
                            {{ (user.pppoeUsername || user.name).charAt(0).toUpperCase() }}
                        </div>
                        <div>
                            <div class="font-bold text-foreground">{{ user.pppoeUsername || user.name }}</div>
                            <div class="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{{ user.whatsapp || '-' }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between sm:justify-end gap-3 px-2 sm:px-0">
                        <Badge 
                            variant="outline"
                            :class="user.status === 'ACTIVE' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-900/50'"
                        >
                            {{ user.status }}
                        </Badge>

                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full text-muted-foreground">
                                    <MoreHorizontal class="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" class="w-56">
                                <DropdownMenuItem @click="router.push(`/users/${user.id}/edit`)" class="gap-2">
                                    <Edit class="w-4 h-4" />
                                    Edit User
                                </DropdownMenuItem>
                                
                                <div class="h-px bg-border my-1"></div>
                                
                                <DropdownMenuItem 
                                    @click="handleDelete(user.id)"
                                    class="gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20"
                                >
                                    <Trash2 class="w-4 h-4" />
                                    Hapus User
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</div>
</template>
