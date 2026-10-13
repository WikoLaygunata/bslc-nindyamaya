<script setup>
import { computed, onMounted, ref } from 'vue'
import { NCard, NEmpty, NIcon, NSpin, NTag, useMessage } from 'naive-ui'
import { CalendarOutline, PeopleOutline, SchoolOutline, VideocamOutline } from '@vicons/ionicons5'
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
const maxSessionCount = computed(() =>
  Math.max(1, ...chartItems.value.map((item) => Number(item.session_count) || 0)),
)

onMounted(fetchHomeData)
</script>

<template>
  <section class="mx-auto max-w-7xl space-y-6">
    <div
      class="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#095754] via-[#0b6862] to-[#063f3d] px-6 py-7 text-white shadow-lg shadow-emerald-950/10 sm:px-8 sm:py-9"
    >
      <div
        class="absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full border-[35px] border-white/5"
      />
      <div
        class="absolute -bottom-28 right-24 -z-10 h-56 w-56 rounded-full bg-[#f0f2c3]/10 blur-2xl"
      />
      <div class="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p class="mb-2 text-sm font-medium text-emerald-100">Perjalanan belajarmu</p>
          <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
            Selamat datang kembali, {{ user?.name || 'mentee' }}
          </h1>
          <p class="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80">
            Terus jaga semangat belajarmu. Pantau perkembangan mentoring di sini.
          </p>
        </div>
        <n-tag class="!border-white/20 !bg-white/10 !text-white" size="large" round>Mentee</n-tag>
      </div>
    </div>

    <n-spin :show="loading">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <n-card
          :bordered="false"
          class="!rounded-2xl shadow-sm ring-1 ring-gray-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-medium text-(--grey-color)">Total sesi</p>
              <p class="mt-3 text-3xl font-bold tracking-tight text-(--dark-color)">
                {{ homeData?.mentoring_sessions_count ?? 0 }}
              </p>
              <p class="mt-1 text-xs text-gray-400">Sesi dalam programmu</p>
            </div>
            <span
              class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-(--green-color)"
            >
              <n-icon size="21"><videocam-outline /></n-icon>
            </span>
          </div>
        </n-card>
        <n-card
          :bordered="false"
          class="!rounded-2xl shadow-sm ring-1 ring-gray-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-(--grey-color)">Mentor saya</p>
              <p class="mt-3 truncate text-xl font-semibold tracking-tight text-(--dark-color)">
                {{ homeData?.mentor_name ?? '-' }}
              </p>
              <p class="mt-1 text-xs text-gray-400">Partner mentoringmu</p>
            </div>
            <span
              class="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"
            >
              <n-icon size="21"><school-outline /></n-icon>
            </span>
          </div>
        </n-card>
        <n-card
          :bordered="false"
          class="!rounded-2xl shadow-sm ring-1 ring-gray-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 xl:col-span-1"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-medium text-(--grey-color)">Akhir program</p>
              <p class="mt-3 text-xl font-semibold tracking-tight text-(--dark-color)">
                {{
                  homeData?.end_date
                    ? new Date(homeData.end_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'Asia/Jakarta',
                      })
                    : '-'
                }}
              </p>
              <p class="mt-1 text-xs text-gray-400">Linimasa programmu</p>
            </div>
            <span
              class="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700"
            >
              <n-icon size="21"><calendar-outline /></n-icon>
            </span>
          </div>
        </n-card>
      </div>
    </n-spin>

    <n-card :bordered="false" class="!rounded-2xl shadow-sm ring-1 ring-gray-100">
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-(--dark-color)">Tren sesi</h2>
        <p class="mt-1 text-sm text-gray-400">Aktivitas selama 6 bulan terakhir</p>
      </div>
      <div v-if="chartItems.length" class="space-y-5">
        <div v-for="item in chartItems" :key="item.month" class="space-y-1">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-(--dark-color)">{{ item.month }}</span>
            <span class="font-medium tabular-nums text-(--grey-color)">
              {{ item.session_count }} sesi
            </span>
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              class="h-full rounded-full bg-gradient-to-r from-(--green-color) to-emerald-400 transition-all duration-500"
              role="progressbar"
              :aria-label="`${item.month}: ${item.session_count} sesi`"
              :aria-valuenow="Number(item.session_count || 0)"
              :aria-valuemin="0"
              :aria-valuemax="maxSessionCount"
              :title="`${item.month}: ${item.session_count} sesi`"
              :style="{ width: `${(Number(item.session_count || 0) / maxSessionCount) * 100}%` }"
            />
          </div>
        </div>
      </div>
      <n-empty v-else description="Belum ada data sesi" class="py-8" />
    </n-card>
  </section>
</template>
