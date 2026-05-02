<script setup>
import { onMounted, ref } from 'vue'
import { NCard, NImage, NSkeleton, useMessage } from 'naive-ui'
import { getMentor } from '@/api/api'

const message = useMessage()
const loading = ref(false)
const mentor = ref(null)
const imageBaseUrl =
  import.meta.env.VITE_IMAGE_BASE_URL ||
  ''

function normalizePayload(payload) {
  const parsed = payload?.data ?? payload
  return parsed || null
}

async function fetchMentor() {
  try {
    loading.value = true
    mentor.value = normalizePayload(await getMentor())
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMentor)
</script>

<template>
  <n-card title="My Mentor" :bordered="false" class="rounded-2xl shadow-sm">
    <div v-if="loading" class="space-y-3">
      <n-skeleton text :repeat="6" />
    </div>
    <div v-else-if="mentor" class="space-y-4">
      <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <div
          v-if="mentor.profile_path"
          class="h-[72px] w-[72px] overflow-hidden rounded-full border border-gray-200"
        >
          <n-image
            :src="
              mentor.profile_path.startsWith('http')
                ? mentor.profile_path
                : imageBaseUrl + mentor.profile_path
            "
            width="72"
            height="72"
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
          class="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-semibold text-(--grey-color)"
        >
          {{ (mentor.name || 'U').slice(0, 1).toUpperCase() }}
        </div>
        <div>
          <p class="text-base font-semibold text-(--dark-color)">{{ mentor.name || '-' }}</p>
          <p class="text-sm text-(--grey-color)">{{ mentor.email || '-' }}</p>
        </div>
      </div>

      <div class="grid gap-3 text-sm sm:grid-cols-2">
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs text-(--grey-color)">NIM</p>
          <p class="mt-1 text-(--dark-color)">{{ mentor.nim || '-' }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs text-(--grey-color)">Phone</p>
          <p class="mt-1 text-(--dark-color)">{{ mentor.phone || '-' }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs text-(--grey-color)">Region</p>
          <p class="mt-1 text-(--dark-color)">{{ mentor.region || '-' }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs text-(--grey-color)">Major</p>
          <p class="mt-1 text-(--dark-color)">{{ mentor.major || '-' }}</p>
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-gray-500">Data mentor belum tersedia.</p>
  </n-card>
</template>
