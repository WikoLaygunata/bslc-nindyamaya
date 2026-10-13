<script setup>
import { computed, ref } from 'vue'
import { NButton, NCard, NImage, NTag, useMessage } from 'naive-ui'
import { updateProfileImage } from '@/api/api'
import { useAuthStore } from '@/stores/auth'
import imageCompression from 'browser-image-compression'

const auth = useAuthStore()
const message = useMessage()
const uploading = ref(false)
const compressingImage = ref(false)
const fileInput = ref(null)

const user = computed(() => auth.user.value ?? {})
const roleLabel = computed(() => {
  const role = user.value.role
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : '-'
})

const imageUrl = computed(() => {
  const path = user.value.profile_path ?? user.value.profile_image ?? user.value.image ?? ''
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ''

  return `${baseUrl}${path}`
})

function triggerFilePicker() {
  fileInput.value?.click()
}

async function handleSelectImage(event) {
  const file = event.target.files?.[0]
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    message.error('Pilih file gambar.')
    event.target.value = ''
    return
  }

  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp',
  }

  try {
    uploading.value = true
    compressingImage.value = true

    const compressedFile = await imageCompression(file, options)
    const response = await updateProfileImage(compressedFile)
    const payload = response?.data ?? response ?? {}
    const nextUser = payload.user ?? payload

    auth.updateUser({
      ...user.value,
      ...nextUser,
    })

    message.success('Foto profil berhasil diperbarui.')
  } catch (error) {
    message.error(error?.message ?? 'Gagal mengunggah foto profil.')
  } finally {
    uploading.value = false
    compressingImage.value = false
    event.target.value = ''
  }
}
</script>

<template>
  <section class="mx-auto max-w-7xl space-y-6">
    <header>
      <p class="text-sm font-medium text-(--green-color)">Akun Anda</p>
      <div class="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-(--dark-color)">Profil</h1>
          <p class="mt-1 text-sm text-gray-500">Atur foto dan lihat informasi akun Anda.</p>
        </div>
        <n-tag size="small" round type="success">{{ roleLabel }}</n-tag>
      </div>
    </header>

    <n-card :bordered="false" class="!rounded-2xl shadow-sm ring-1 ring-gray-100">
      <div class="flex flex-col gap-6 md:flex-row md:items-start">
        <div
          class="flex w-full flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-[#f5faf7] to-white p-6 ring-1 ring-gray-100 md:w-64"
        >
          <div
            v-if="imageUrl"
            class="h-[132px] w-[132px] overflow-hidden rounded-full border-4 border-white shadow-lg ring-1 ring-gray-200"
          >
            <n-image
              :src="imageUrl"
              alt="Foto profil pengguna"
              width="120"
              height="120"
              :img-props="{
                style: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                },
              }"
            />
          </div>
          <div
            v-else
            class="flex h-[132px] w-[132px] items-center justify-center rounded-full border-4 border-white bg-emerald-50 text-3xl font-semibold text-(--green-color) shadow-lg ring-1 ring-gray-200"
          >
            {{ (user.name || 'U').slice(0, 1).toUpperCase() }}
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleSelectImage"
          />
          <n-button
            class="!rounded-xl"
            type="primary"
            :loading="uploading || compressingImage"
            :disabled="uploading || compressingImage"
            @click="triggerFilePicker"
          >
            {{ uploading || compressingImage ? 'Memproses...' : 'Ubah foto profil' }}
          </n-button>
        </div>

        <div class="grid flex-1 gap-3 sm:grid-cols-2">
          <div
            class="rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Nama</p>
            <p class="mt-2 break-words text-sm font-semibold text-(--dark-color)">
              {{ user.name || '-' }}
            </p>
          </div>
          <div
            class="rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Email</p>
            <p class="mt-2 break-words text-sm text-(--dark-color)">{{ user.email || '-' }}</p>
          </div>
          <div
            class="rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400">NIM</p>
            <p class="mt-2 break-words text-sm text-(--dark-color)">{{ user.nim || '-' }}</p>
          </div>
          <div
            class="rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Wilayah</p>
            <p class="mt-2 break-words text-sm text-(--dark-color)">{{ user.region || '-' }}</p>
          </div>
          <div
            class="rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50 sm:col-span-2"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Jurusan</p>
            <p class="mt-2 break-words text-sm text-(--dark-color)">{{ user.major || '-' }}</p>
          </div>
        </div>
      </div>
    </n-card>
  </section>
</template>
