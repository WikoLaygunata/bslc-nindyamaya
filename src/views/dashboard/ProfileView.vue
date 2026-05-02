<script setup>
import { computed, ref } from 'vue'
import { NButton, NCard, NImage, NTag, useMessage } from 'naive-ui'
import { updateProfileImage } from '@/api/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const message = useMessage()
const uploading = ref(false)
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

  const baseUrl =
    import.meta.env.VITE_IMAGE_BASE_URL ||
    ''

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
    message.error('Please choose an image file')
    event.target.value = ''
    return
  }

  try {
    uploading.value = true
    const response = await updateProfileImage(file)
    const payload = response?.data ?? response ?? {}
    const nextUser = payload.user ?? payload

    auth.updateUser({
      ...user.value,
      ...nextUser,
    })

    message.success('Profile image updated')
  } catch (error) {
    message.error(error.message)
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}
</script>

<template>
  <section class="space-y-4">
    <n-card :bordered="false" class="rounded-2xl shadow-sm">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-(--dark-color)">Profile</h2>
        <n-tag size="small" round type="success">{{ roleLabel }}</n-tag>
      </div>

      <div class="flex flex-col gap-6 md:flex-row md:items-start">
        <div class="flex w-full flex-col items-center gap-3 rounded-xl border border-gray-100 p-4 md:w-56">
          <div v-if="imageUrl" class="h-[120px] w-[120px] overflow-hidden rounded-full border border-gray-200">
            <n-image
              :src="imageUrl"
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
            class="flex h-[120px] w-[120px] items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-3xl font-semibold text-(--grey-color)"
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
          <n-button type="primary" :loading="uploading" @click="triggerFilePicker">
            Change Profile Image
          </n-button>
        </div>

        <div class="grid flex-1 gap-3 sm:grid-cols-2">
          <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p class="text-xs text-(--grey-color)">Name</p>
            <p class="mt-1 text-sm font-medium text-(--dark-color)">{{ user.name || '-' }}</p>
          </div>
          <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p class="text-xs text-(--grey-color)">Email</p>
            <p class="mt-1 text-sm text-(--dark-color)">{{ user.email || '-' }}</p>
          </div>
          <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p class="text-xs text-(--grey-color)">NIM</p>
            <p class="mt-1 text-sm text-(--dark-color)">{{ user.nim || '-' }}</p>
          </div>
          <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p class="text-xs text-(--grey-color)">Region</p>
            <p class="mt-1 text-sm text-(--dark-color)">{{ user.region || '-' }}</p>
          </div>
          <div class="rounded-xl border border-gray-100 bg-gray-50 p-3 sm:col-span-2">
            <p class="text-xs text-(--grey-color)">Major</p>
            <p class="mt-1 text-sm text-(--dark-color)">{{ user.major || '-' }}</p>
          </div>
        </div>
      </div>
    </n-card>
  </section>
</template>
