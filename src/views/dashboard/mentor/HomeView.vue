<script setup>
import { computed, onMounted, ref } from 'vue'
import { NCard, NEmpty, NSpin, NTag, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { getHome } from '@/api/api'

const auth = useAuthStore()
const user = computed(() => auth.user.value)
const message = useMessage()
const loading = ref(false)
const homeData = ref(null)

function normalizePayload(payload) {
  return payload?.data ?? payload
}

async function fetchHomeData() {
  try {
    loading.value = true
    homeData.value = normalizePayload(await getHome())
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}

const chartItems = computed(() => homeData.value?.line_chart ?? [])

onMounted(fetchHomeData)
</script>

<template>
  <section class="space-y-4">
    <n-card :bordered="false" class="rounded-2xl shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm text-(--grey-color)">Welcome back</p>
          <h2 class="text-xl font-bold text-(--dark-color)">{{ user?.name || '-' }}</h2>
        </div>
        <n-tag type="success" size="large" round>Mentor</n-tag>
      </div>
    </n-card>

    <n-spin :show="loading">
      <div class="grid gap-4 md:grid-cols-3">
        <n-card :bordered="false" class="rounded-2xl shadow-sm">
          <p class="text-sm text-(--grey-color)">Total Sessions</p>
          <p class="mt-1 text-3xl font-bold text-(--green-color)">
            {{ homeData?.mentoring_sessions_count ?? 0 }}
          </p>
        </n-card>
        <n-card :bordered="false" class="rounded-2xl shadow-sm">
          <p class="text-sm text-(--grey-color)">Total Mentees</p>
          <p class="mt-1 text-3xl font-bold text-(--green-color)">
            {{ homeData?.mentee_count ?? 0 }}
          </p>
        </n-card>
        <n-card :bordered="false" class="rounded-2xl shadow-sm">
          <p class="text-sm text-(--grey-color)">Program End Date</p>
          <p class="mt-1 text-lg font-semibold text-(--dark-color)">
            {{ homeData?.end_date ? new Date(homeData.end_date).toLocaleDateString() : '-' }}
          </p>
        </n-card>
      </div>
    </n-spin>

    <n-card title="Sessions Trend (Last 6 Months)" :bordered="false" class="rounded-2xl shadow-sm">
      <div v-if="chartItems.length" class="space-y-3">
        <div v-for="item in chartItems" :key="item.month" class="space-y-1">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-(--dark-color)">{{ item.month }}</span>
            <span class="text-(--grey-color)">{{ item.session_count }} sessions</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              class="h-full rounded-full bg-(--green-color)"
              :style="{ width: `${Math.min(item.session_count * 15, 100)}%` }"
            />
          </div>
        </div>
      </div>
      <n-empty v-else description="No chart data yet" />
    </n-card>
  </section>
</template>
