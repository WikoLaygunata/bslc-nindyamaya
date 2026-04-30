<script setup>
import { computed, onMounted, ref } from 'vue'
import { NCard, NDataTable, NInput, NSpace, useMessage } from 'naive-ui'
import { getMentees } from '@/api/api'

const message = useMessage()
const loading = ref(false)
const data = ref([])
const search = ref('')

const columns = [
  { title: 'No', key: 'no', width: 50, align: 'center', render: (_, index) => index + 1 },
  {
    title: 'Name',
    key: 'name',
    titleAlign: 'center',
    sorter: (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')),
  },
  { title: 'Email', key: 'email', titleAlign: 'center' },
  { title: 'NIM', key: 'nim', titleAlign: 'center' },
  {
    title: 'Region',
    key: 'region',
    titleAlign: 'center',
    sorter: (a, b) => String(a.region ?? '').localeCompare(String(b.region ?? '')),
  },
  {
    title: 'Major',
    key: 'major',
    titleAlign: 'center',
    sorter: (a, b) => String(a.major ?? '').localeCompare(String(b.major ?? '')),
  },
  { title: 'Phone', key: 'phone', titleAlign: 'center' },
]

const filteredData = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) {
    return data.value
  }

  return data.value.filter((row) =>
    [row.name, row.region, row.major, row.phone].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(keyword),
    ),
  )
})

function normalizePayload(payload) {
  return payload?.data ?? payload ?? []
}

async function fetchMentees() {
  try {
    loading.value = true
    const payload = await getMentees()
    data.value = normalizePayload(payload)
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
    <n-space vertical :size="12">
      <n-input
        v-model:value="search"
        clearable
        placeholder="Search name, region, major, or phone"
      />
      <n-data-table
        :columns="columns"
        :data="filteredData"
        :loading="loading"
        :single-line="false"
        size="small"
        :scroll-x="900"
      />
    </n-space>
  </n-card>
</template>
