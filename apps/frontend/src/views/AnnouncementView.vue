<template>
  <div class="min-h-screen bg-background pb-20">
    <Header 
        title="Pengumuman" 
        subtitle="Kelola pengumuman di halaman utama"
        :show-back="true"
    />

    <main class="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <!-- Preview Card -->
        <Card v-if="form.announcementActive">
            <CardHeader class="border-b bg-muted/20 pb-4">
                <CardTitle class="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent class="pt-6">
                <AnnouncementBanner 
                    :active="true"
                    :title="form.announcementTitle || 'Pengumuman'"
                    :message="form.announcementMessage || 'Isi pengumuman akan muncul di sini...'"
                    :type="form.announcementType"
                    :created-at="form.announcementCreatedAt"
                    :updated-at="form.announcementUpdatedAt"
                />
            </CardContent>
        </Card>

        <!-- Editor Card -->
        <Card>
            <CardHeader class="border-b bg-muted/20 pb-4">
                <CardTitle>Pengaturan Pengumuman</CardTitle>
            </CardHeader>
            <CardContent class="pt-6 space-y-6">
                <!-- Toggle -->
                <div class="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                    <div>
                        <h3 class="font-medium">Tampilkan Pengumuman</h3>
                        <p class="text-xs text-muted-foreground mt-0.5">Aktifkan untuk menampilkan pengumuman di halaman utama</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            v-model="form.announcementActive" 
                            class="sr-only peer"
                        />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div v-if="form.announcementActive" class="space-y-6 animate-in fade-in slide-in-from-top-2">
                    <!-- Title -->
                    <div class="space-y-2">
                        <Label for="title">Judul Pengumuman</Label>
                        <Input 
                            id="title" 
                            v-model="form.announcementTitle" 
                            placeholder="Contoh: Pengumuman Penting" 
                        />
                    </div>

                    <!-- Type -->
                    <div class="space-y-2">
                        <Label for="type">Tipe / Warna</Label>
                        <select 
                            id="type" 
                            v-model="form.announcementType"
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="INFO">Info (Biru) - Berita Umum</option>
                            <option value="SUCCESS">Success (Hijau) - Kabar Baik</option>
                            <option value="WARNING">Warning (Kuning) - Peringatan</option>
                            <option value="DANGER">Danger (Merah) - Masalah Kritis/Maintenance</option>
                        </select>
                    </div>

                    <!-- Rich Text Editor -->
                    <div class="space-y-2">
                        <Label>Isi Pengumuman</Label>
                        
                        <!-- Toolbar -->
                        <div v-if="editor" class="border border-input rounded-t-md bg-secondary/30 p-2 flex flex-wrap gap-1">
                            <button
                                @click="editor.chain().focus().toggleBold().run()"
                                :class="{ 'bg-primary text-primary-foreground': editor.isActive('bold') }"
                                class="px-3 py-1.5 rounded text-sm font-medium hover:bg-secondary transition-colors"
                                type="button"
                            >
                                <strong>B</strong>
                            </button>
                            <button
                                @click="editor.chain().focus().toggleItalic().run()"
                                :class="{ 'bg-primary text-primary-foreground': editor.isActive('italic') }"
                                class="px-3 py-1.5 rounded text-sm font-medium hover:bg-secondary transition-colors italic"
                                type="button"
                            >
                                I
                            </button>
                            <button
                                @click="editor.chain().focus().toggleStrike().run()"
                                :class="{ 'bg-primary text-primary-foreground': editor.isActive('strike') }"
                                class="px-3 py-1.5 rounded text-sm font-medium hover:bg-secondary transition-colors line-through"
                                type="button"
                            >
                                S
                            </button>
                            <div class="w-px h-6 bg-border my-auto"></div>
                            <button
                                @click="editor.chain().focus().toggleBulletList().run()"
                                :class="{ 'bg-primary text-primary-foreground': editor.isActive('bulletList') }"
                                class="px-3 py-1.5 rounded text-sm font-medium hover:bg-secondary transition-colors"
                                type="button"
                            >
                                • List
                            </button>
                            <button
                                @click="editor.chain().focus().toggleOrderedList().run()"
                                :class="{ 'bg-primary text-primary-foreground': editor.isActive('orderedList') }"
                                class="px-3 py-1.5 rounded text-sm font-medium hover:bg-secondary transition-colors"
                                type="button"
                            >
                                1. List
                            </button>
                            <div class="w-px h-6 bg-border my-auto"></div>
                            <button
                                @click="setLink"
                                :class="{ 'bg-primary text-primary-foreground': editor.isActive('link') }"
                                class="px-3 py-1.5 rounded text-sm font-medium hover:bg-secondary transition-colors"
                                title="Tambah Link"
                                type="button"
                            >
                                <LinkIcon class="w-4 h-4" />
                            </button>
                            <button
                                v-if="editor.isActive('link')"
                                @click="editor.chain().focus().unsetLink().run()"
                                class="px-3 py-1.5 rounded text-sm font-medium hover:bg-secondary transition-colors text-destructive"
                                title="Hapus Link"
                                type="button"
                            >
                                <Link2Off class="w-4 h-4" />
                            </button>
                        </div>

                        <!-- Editor Content -->
                        <EditorContent 
                            :editor="editor" 
                            class="prose prose-sm max-w-none dark:prose-invert border border-input rounded-b-md p-4 min-h-[200px] bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                        />
                        <p class="text-xs text-muted-foreground">
                            Gunakan toolbar di atas untuk memformat teks. Mendukung bold, italic, dan list.
                        </p>
                    </div>
                </div>

                <!-- Save Button -->
                <div class="pt-6 border-t border-border">
                    <Button class="w-full sm:w-auto" @click="saveAnnouncement" :disabled="loading">
                        <Save class="w-4 h-4 mr-2" />
                        <span v-if="loading">Menyimpan...</span>
                        <span v-else>Simpan Pengumuman</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { Save, Link as LinkIcon, Link2Off } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import AnnouncementBanner from '@/components/AnnouncementBanner.vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import type { UpdateSettingsDTO } from '@/types'

const { toast } = useToast()
const settingsStore = useSettingsStore()
const loading = ref(false)

const form = ref<UpdateSettingsDTO>({
  announcementTitle: 'Pengumuman',
  announcementMessage: '',
  announcementType: 'INFO',
  announcementActive: false,
})

// Tiptap Editor
const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Tulis isi pengumuman di sini...',
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'transition-opacity hover:opacity-80 underline',
      },
    }),
  ],
  content: form.value.announcementMessage || '',
  onUpdate: ({ editor }) => {
    form.value.announcementMessage = editor.getHTML()
  },
})

const setLink = () => {
  if (!editor.value) return

  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)

  // cancelled
  if (url === null) {
    return
  }

  // empty
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  // update link
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const fetchSettings = async () => {
  const data = await settingsStore.fetchSettings(true)
  if (data) {
    form.value.announcementTitle = data.announcementTitle || 'Pengumuman'
    form.value.announcementMessage = data.announcementMessage || ''
    form.value.announcementType = data.announcementType || 'INFO'
    form.value.announcementActive = data.announcementActive || false
    
    // Update editor content
    if (editor.value) {
      editor.value.commands.setContent(form.value.announcementMessage || '')
    }
  }
}

const saveAnnouncement = async () => {
  loading.value = true
  try {
    await settingsStore.updateSettings({
      announcementTitle: form.value.announcementTitle,
      announcementMessage: form.value.announcementMessage,
      announcementType: form.value.announcementType,
      announcementActive: form.value.announcementActive,
    })
    toast({
      title: 'Berhasil',
      description: 'Pengumuman berhasil disimpan.',
      variant: 'success'
    })
  } catch (error: any) {
    console.error(error)
    toast({
      title: 'Gagal',
      description: error.message || 'Terjadi kesalahan saat menyimpan pengumuman.',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSettings()
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style>
/* Tiptap Editor Styles */
.ProseMirror {
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.ProseMirror ul {
  list-style-type: disc;
}

.ProseMirror ol {
  list-style-type: decimal;
}

.ProseMirror li {
  margin: 0.25rem 0;
}

.ProseMirror strong {
  font-weight: 700;
}

.ProseMirror em {
  font-style: italic;
}

.ProseMirror s {
  text-decoration: line-through;
}
</style>
