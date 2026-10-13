<script setup>
import { onMounted, ref } from 'vue'
import { NButton, NCard, NImage, NSkeleton, useMessage } from 'naive-ui'
import { getMentor } from '@/api/api'
import { getWhatsAppUrl } from '@/utils/whatsapp'

const message = useMessage()
const loading = ref(false)
const mentor = ref(null)
const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ''

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
  <section class="mx-auto max-w-5xl space-y-6">
    <header>
      <p class="text-sm font-medium text-(--green-color)">Koneksi mentoring</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-(--dark-color)">Mentor Saya</h1>
    </header>

    <n-card :bordered="false" class="!rounded-2xl shadow-sm ring-1 ring-gray-100">
      <div v-if="loading" class="space-y-4">
        <n-skeleton height="96px" width="100%" :sharp="false" />
        <div class="grid gap-3 sm:grid-cols-2">
          <n-skeleton v-for="item in 4" :key="item" height="72px" :sharp="false" />
        </div>
      </div>
      <div v-else-if="mentor" class="space-y-5">
        <div
          class="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-[#f1f8f4] to-[#fbfcf8] p-5 sm:flex-row sm:items-center"
        >
          <div
            v-if="mentor.profile_path"
            class="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md ring-1 ring-gray-200"
          >
            <n-image
              alt="Foto mentor"
              :src="
                mentor.profile_path.startsWith('http')
                  ? mentor.profile_path
                  : imageBaseUrl + mentor.profile_path
              "
              width="88"
              height="88"
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
            class="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full border-4 border-white bg-emerald-50 text-2xl font-semibold text-(--green-color) shadow-md ring-1 ring-gray-200"
          >
            {{ (mentor.name || 'U').slice(0, 1).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-xl font-semibold text-(--dark-color)">{{ mentor.name || '-' }}</p>
            <p class="mt-1 break-all text-sm text-(--grey-color)">{{ mentor.email || '-' }}</p>
            <span
              class="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-(--green-color) ring-1 ring-emerald-100"
            >
              Mentor Anda
            </span>
          </div>
        </div>

        <div class="grid gap-3 text-sm sm:grid-cols-2">
          <div class="rounded-xl border border-gray-100 bg-white p-4">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400">NIM</p>
            <p class="mt-2 break-words font-medium text-(--dark-color)">{{ mentor.nim || '-' }}</p>
          </div>
          <div class="rounded-xl border border-gray-100 bg-white p-4">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Telepon</p>
            <p class="mt-2 break-words font-medium text-(--dark-color)">
              {{ mentor.phone || '-' }}
            </p>
          </div>
          <div class="rounded-xl border border-gray-100 bg-white p-4">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Wilayah</p>
            <p class="mt-2 break-words font-medium text-(--dark-color)">
              {{ mentor.region || '-' }}
            </p>
          </div>
          <div class="rounded-xl border border-gray-100 bg-white p-4">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Jurusan</p>
            <p class="mt-2 break-words font-medium text-(--dark-color)">
              {{ mentor.major || '-' }}
            </p>
          </div>
        </div>
        <n-button
          v-if="getWhatsAppUrl(mentor.phone)"
          tag="a"
          :href="getWhatsAppUrl(mentor.phone)"
          target="_blank"
          rel="noopener noreferrer"
          class="!min-h-11 !w-full !rounded-xl sm:!w-auto"
          type="success"
          aria-label="Hubungi mentor melalui WhatsApp"
        >
          Hubungi via WhatsApp
        </n-button>
      </div>
      <div v-else class="rounded-2xl bg-gray-50 px-6 py-12 text-center">
        <p class="font-medium text-(--dark-color)">Informasi mentor belum tersedia</p>
        <p class="mt-1 text-sm text-gray-500">Silakan periksa kembali nanti.</p>
      </div>
    </n-card>
  </section>
</template>
