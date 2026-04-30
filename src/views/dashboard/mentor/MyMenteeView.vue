<script setup>
import { onMounted, ref } from 'vue'
import { NCard, NDataTable, useMessage } from 'naive-ui'
import { getMentees } from '@/api/api'

const message = useMessage()
const loading = ref(false)
const data = ref([])

const columns = [
  { title: 'No', key: 'no', width: 60, align: 'center' },
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'NIM', key: 'nim' },
  { title: 'Region', key: 'region' },
  { title: 'Major', key: 'major' },
  { title: 'Phone', key: 'phone' },

  // {
  //   title: 'Status',
  //   key: 'is_active',
  //   width: 110,
  //   render: (row) =>
  //     h(
  //       NTag,
  //       { type: row.is_active ? 'success' : 'error', round: true, size: 'small' },
  //       { default: () => (row.is_active ? 'Active' : 'Inactive') },
  //     ),
  // },
]

function normalizePayload(payload) {
  return payload?.data ?? payload ?? []
}

async function fetchMentees() {
  try {
    loading.value = true
    const payload = await getMentees()
    data.value = normalizePayload(payload).map((item, index) => ({
      ...item,
      no: index + 1,
    }))
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMentees)
</script>

<template>
  <n-card title="My Mentee" :bordered="false" class="rounded-2xl shadow-sm">
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
