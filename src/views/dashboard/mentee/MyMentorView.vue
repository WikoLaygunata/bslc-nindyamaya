<script setup>
import { h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NTag, useMessage } from 'naive-ui'
import { getMentor } from '@/api/api'

const message = useMessage()
const loading = ref(false)
const data = ref([])

const columns = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'NIM', key: 'nim' },
  { title: 'Region', key: 'region' },
  { title: 'Major', key: 'major' },
  { title: 'Phone', key: 'phone' },
  {
    title: 'Status',
    key: 'is_active',
    width: 110,
    render: (row) =>
      h(
        NTag,
        { type: row.is_active ? 'success' : 'error', round: true, size: 'small' },
        { default: () => (row.is_active ? 'Active' : 'Inactive') }
      ),
  },
]

function normalizePayload(payload) {
  const parsed = payload?.data ?? payload
  return parsed ? [parsed] : []
}

async function fetchMentor() {
  try {
    loading.value = true
    data.value = normalizePayload(await getMentor())
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
    <n-data-table
      :columns="columns"
      :data="data"
      :loading="loading"
      :single-line="false"
      size="small"
      :scroll-x="900"
    />
  </n-card>
</template>
