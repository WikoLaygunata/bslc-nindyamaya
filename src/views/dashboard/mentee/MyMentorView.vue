<script setup>
import { onMounted, ref } from 'vue'
import { NCard, NSkeleton, useMessage } from 'naive-ui'
import { getMentor } from '@/api/api'

const message = useMessage()
const loading = ref(false)
const mentor = ref(null)

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
    <div v-else-if="mentor" class="space-y-3 text-sm">
      <p><span class="font-semibold">Name:</span> {{ mentor.name || '-' }}</p>
      <p><span class="font-semibold">Email:</span> {{ mentor.email || '-' }}</p>
      <p><span class="font-semibold">NIM:</span> {{ mentor.nim || '-' }}</p>
      <p><span class="font-semibold">Region:</span> {{ mentor.region || '-' }}</p>
      <p><span class="font-semibold">Major:</span> {{ mentor.major || '-' }}</p>
      <p><span class="font-semibold">Phone:</span> {{ mentor.phone || '-' }}</p>
    </div>
    <p v-else class="text-sm text-gray-500">Data mentor belum tersedia.</p>
  </n-card>
</template>
