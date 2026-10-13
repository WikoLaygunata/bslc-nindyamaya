<script setup>
import { computed, h, onMounted, ref } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NImage,
  NInput,
  NModal,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui'
import { attendMentoringSession, getMentoringSessions } from '@/api/api'

const message = useMessage()
const loading = ref(false)
const attendingId = ref(null)
const sessions = ref([])
const search = ref('')
const activeFilter = ref('all')
const selectedSession = ref(null)
const showSessionModal = ref(false)
const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ''

function normalizePayload(payload) {
  return payload?.data ?? payload ?? []
}

function normalizeSession(item) {
  return {
    id: item.id,
    topic: item.course_name ?? item.topic ?? item.title ?? '-',
    location: item.platform ?? item.location ?? item.place ?? '-',
    start_time: item.start_time ?? item.startTime ?? null,
    end_time: item.end_time ?? item.endTime ?? null,
    created_at: item.created_at ?? null,
    notes: item.notes ?? '',
    documentation_path: item.documentation_path ?? '',
    status: item.status ?? 'Pending',
    attended: Boolean(item.attended),
  }
}

function getAttendanceState(row) {
  if (row.attended) {
    return 'attended'
  }

  if (!row.start_time || !row.end_time) {
    return 'unavailable'
  }

  const now = Date.now()
  const start = new Date(row.start_time).getTime()
  const end = new Date(row.end_time).getTime()

  if (now > end) {
    return 'missed'
  }

  if (now < start) {
    return 'upcoming'
  }

  return 'available'
}

function formatSchedule(row) {
  if (!row.start_time || !row.end_time) {
    return '-'
  }

  const startDate = new Date(row.start_time)
  const endDate = new Date(row.end_time)
  const date = startDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
  const startTime = startDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  })
  const endTime = endDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  })
  return `${date}, ${startTime}–${endTime} WIB`
}

function renderSchedule(row) {
  const [date, time] = formatSchedule(row).split(', ')
  if (!time) return date

  return h('div', { class: 'flex flex-col items-center gap-1' }, [
    h('span', { class: 'text-sm text-(--dark-color)' }, date),
    h(
      'span',
      {
        class:
          'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-(--green-color)',
      },
      time,
    ),
  ])
}

function formatSessionDate(row) {
  if (!row.start_time) return 'Jadwal belum tersedia'
  return new Date(row.start_time).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

function formatSessionTime(row) {
  if (!row.start_time || !row.end_time) return ''
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  }
  const start = new Date(row.start_time).toLocaleTimeString('id-ID', options)
  const end = new Date(row.end_time).toLocaleTimeString('id-ID', options)
  return `${start}–${end}`
}

function getAttendanceLabel(row) {
  const labels = {
    attended: 'Sudah hadir',
    missed: 'Terlewat',
    upcoming: 'Akan datang',
    unavailable: 'Jadwal belum tersedia',
    available: 'Sedang berlangsung',
  }
  return labels[getAttendanceState(row)]
}

function getAttendanceTagType(row) {
  const types = {
    attended: 'success',
    missed: 'error',
    upcoming: 'warning',
    unavailable: 'default',
    available: 'info',
  }
  return types[getAttendanceState(row)]
}

function handleRowClick(row) {
  selectedSession.value = row
  showSessionModal.value = true
}

function rowProps(row) {
  return {
    style: 'cursor: pointer;',
    tabindex: 0,
    onKeydown: (event) => {
      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        handleRowClick(row)
      }
    },
    onClick: () => handleRowClick(row),
  }
}

const statusFilters = computed(() => [
  { key: 'all', label: 'Semua', count: sessions.value.length },
  {
    key: 'upcoming',
    label: 'Akan datang',
    count: sessions.value.filter((row) =>
      ['upcoming', 'available'].includes(getAttendanceState(row)),
    ).length,
  },
  {
    key: 'completed',
    label: 'Selesai',
    count: sessions.value.filter((row) => ['attended', 'missed'].includes(getAttendanceState(row)))
      .length,
  },
])

const filteredSessions = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return sessions.value.filter((row) => {
    const state = getAttendanceState(row)
    const matchesFilter =
      activeFilter.value === 'all' ||
      (activeFilter.value === 'upcoming' && ['upcoming', 'available'].includes(state)) ||
      (activeFilter.value === 'completed' && ['attended', 'missed'].includes(state))
    const searchable = [
      row.topic,
      row.location,
      formatSchedule(row),
      row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '',
      getAttendanceLabel(row),
      row.notes,
      row.status?.toLowerCase() === 'finished' ? 'selesai' : 'direncanakan',
    ]

    return (
      matchesFilter &&
      (!keyword ||
        searchable.some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(keyword),
        ))
    )
  })
})

async function fetchSessions() {
  try {
    loading.value = true
    const payload = await getMentoringSessions()
    sessions.value = normalizePayload(payload).map(normalizeSession)

    if (selectedSession.value) {
      selectedSession.value =
        sessions.value.find((session) => session.id === selectedSession.value.id) ?? null
    }
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}

async function handleAttend(sessionId) {
  try {
    attendingId.value = sessionId
    await attendMentoringSession(sessionId)
    message.success('Kehadiran berhasil dicatat')
    await fetchSessions()
  } catch (error) {
    message.error(error.message)
  } finally {
    attendingId.value = null
  }
}

const columns = [
  {
    title: 'No.',
    key: 'no',
    width: 50,
    align: 'center',
    render: (_, index) => index + 1,
  },
  {
    title: 'Topik',
    key: 'topic',
    width: 200,
    titleAlign: 'center',
    sorter: (a, b) => a.topic.localeCompare(b.topic),
  },
  {
    title: 'Jadwal',
    key: 'schedule',
    width: 200,
    titleAlign: 'center',
    sorter: (a, b) => new Date(a.start_time ?? 0).getTime() - new Date(b.start_time ?? 0).getTime(),
    render: (row) => renderSchedule(row),
  },
  {
    title: 'Platform',
    key: 'location',
    width: 140,
    titleAlign: 'center',
  },
  {
    title: 'Dibuat',
    key: 'created_at',
    width: 120,
    titleAlign: 'center',
    render: (row) =>
      row.created_at
        ? new Date(row.created_at).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '-',
  },
  {
    title: 'Catatan',
    key: 'notes',
    width: 220,
    titleAlign: 'center',
    render: (row) =>
      h(
        'p',
        {
          style:
            'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-line;',
          class: 'text-sm',
        },
        row.notes || '-',
      ),
  },
  {
    title: 'Dokumentasi',
    key: 'documentation_path',
    width: 120,
    align: 'center',
    render: (row) =>
      row.documentation_path
        ? h(NImage, {
            src: baseUrl + row.documentation_path,
            width: 48,
            height: 48,
            objectFit: 'cover',
            previewDisabled: true,
          })
        : '-',
  },
  {
    title: 'Status sesi',
    key: 'session_status',
    width: 130,
    align: 'center',
    render: (row) => {
      const status = String(row.status ?? 'Pending')
      const finished = status.toLowerCase() === 'finished'
      return h(
        NTag,
        { type: finished ? 'success' : 'warning', size: 'small', round: true },
        { default: () => (finished ? 'Selesai' : 'Direncanakan') },
      )
    },
  },
  {
    title: 'Kehadiran',
    key: 'attend',
    width: 130,
    align: 'center',
    render: (row) => {
      const state = getAttendanceState(row)

      if (state === 'attended') {
        return h(NTag, { type: 'success', size: 'small', round: true }, { default: () => 'Hadir' })
      }

      if (state === 'missed') {
        return h(NTag, { type: 'error', size: 'small', round: true }, { default: () => 'Terlewat' })
      }

      if (state === 'upcoming') {
        return h(
          NTag,
          { type: 'warning', size: 'small', round: true },
          { default: () => 'Akan datang' },
        )
      }

      if (state === 'unavailable') {
        return h(NTag, { size: 'small', round: true }, { default: () => 'Belum terjadwal' })
      }

      return h(
        NButton,
        {
          size: 'small',
          type: 'success',
          strong: true,
          ghost: false,
          loading: attendingId.value === row.id,
          'aria-label': `Catat kehadiran untuk ${row.topic}`,
          style: {
            color: '#fff',
            backgroundColor: 'var(--green-color)',
            borderColor: 'var(--green-color)',
            letterSpacing: '0.5px',
          },
          onClick: (event) => {
            event.stopPropagation()
            handleAttend(row.id)
          },
        },
        { default: () => 'Hadir' },
      )
    },
  },
]

onMounted(fetchSessions)
</script>

<template>
  <section class="mx-auto max-w-7xl space-y-6">
    <header>
      <p class="text-sm font-medium text-(--green-color)">Belajar bersama</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-(--dark-color)">Sesi Mentoring</h1>
      <p class="mt-1 text-sm text-gray-500">Lihat jadwal, detail sesi, dan catat kehadiranmu.</p>
    </header>
    <n-card :bordered="false" class="!rounded-2xl shadow-sm ring-1 ring-gray-100">
      <n-space vertical :size="16">
        <n-input
          v-model:value="search"
          clearable
          round
          aria-label="Cari sesi mentoring"
          placeholder="Cari topik, jadwal, catatan, atau status"
        />
        <div class="flex flex-wrap gap-2" role="group" aria-label="Filter sesi">
          <button
            v-for="filter in statusFilters"
            :key="filter.key"
            type="button"
            class="rounded-full border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--green-color)"
            :class="
              activeFilter === filter.key
                ? 'border-(--green-color) bg-(--green-color) text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'
            "
            :aria-pressed="activeFilter === filter.key"
            @click="activeFilter = filter.key"
          >
            {{ filter.label }}
            <span class="ml-1 tabular-nums opacity-80">{{ filter.count }}</span>
          </button>
          <span class="ml-auto self-center text-xs text-gray-500" aria-live="polite">
            {{ filteredSessions.length }} dari {{ sessions.length }} sesi
          </span>
        </div>
        <div class="hidden overflow-hidden rounded-xl border border-gray-100 md:block">
          <n-data-table
            :columns="columns"
            :data="filteredSessions"
            :loading="loading"
            :row-props="rowProps"
            :single-line="false"
            size="small"
            :scroll-x="1500"
          />
        </div>
        <div class="space-y-3 md:hidden" aria-label="Daftar sesi mentoring">
          <article
            v-for="session in filteredSessions"
            :key="session.id"
            class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="break-words font-semibold text-(--dark-color)">{{ session.topic }}</h2>
                <p class="mt-1 truncate text-sm text-gray-500">{{ session.location }}</p>
              </div>
              <n-tag :type="getAttendanceTagType(session)" size="small" round>
                {{ getAttendanceLabel(session) }}
              </n-tag>
            </div>
            <div class="mt-4 rounded-xl bg-emerald-50/70 p-3">
              <p class="text-xs font-medium uppercase tracking-wide text-(--green-color)">Jadwal</p>
              <p class="mt-1 text-sm font-semibold text-(--dark-color)">
                {{ formatSessionDate(session) }}
              </p>
              <p
                v-if="formatSessionTime(session)"
                class="mt-0.5 text-sm tabular-nums text-gray-600"
              >
                {{ formatSessionTime(session) }} WIB
              </p>
            </div>
            <div class="mt-4 flex gap-2">
              <n-button
                class="!min-h-11 !flex-1 !rounded-xl"
                secondary
                :aria-label="`Lihat detail sesi ${session.topic}`"
                @click="handleRowClick(session)"
              >
                Lihat detail
              </n-button>
              <n-button
                v-if="getAttendanceState(session) === 'available'"
                class="!min-h-11 !flex-1 !rounded-xl"
                type="success"
                :loading="attendingId === session.id"
                :aria-label="`Catat kehadiran untuk ${session.topic}`"
                @click="handleAttend(session.id)"
              >
                Hadir
              </n-button>
            </div>
          </article>
          <div
            v-if="!loading && !filteredSessions.length"
            class="rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500"
          >
            Tidak ada sesi yang cocok dengan pencarian atau filter ini.
          </div>
        </div>
      </n-space>
    </n-card>
  </section>

  <n-modal
    v-model:show="showSessionModal"
    :auto-focus="false"
    preset="card"
    title="Detail Sesi"
    size="small"
    style="width: min(420px, calc(100vw - 32px))"
  >
    <div v-if="selectedSession" class="space-y-4 py-1">
      <div class="grid grid-cols-[100px_1fr] gap-x-3 gap-y-3 rounded-xl bg-gray-50 p-4 text-sm">
        <span class="text-(--grey-color)">Topik</span>
        <span class="font-medium text-(--dark-color)">{{ selectedSession.topic || '-' }}</span>

        <span class="text-(--grey-color)">Jadwal</span>
        <span class="text-(--dark-color)">{{ formatSchedule(selectedSession) }}</span>

        <span class="text-(--grey-color)">Platform</span>
        <span class="text-(--dark-color)">{{ selectedSession.location || '-' }}</span>

        <span class="text-(--grey-color)">Status sesi</span>
        <span class="text-(--dark-color)">
          {{ selectedSession.status?.toLowerCase() === 'finished' ? 'Selesai' : 'Direncanakan' }}
        </span>

        <span class="text-(--grey-color)">Kehadiran</span>
        <span class="text-(--dark-color)">{{ getAttendanceLabel(selectedSession) }}</span>

        <span class="text-(--grey-color)">Dibuat</span>
        <span class="text-(--dark-color)">
          {{
            selectedSession.created_at
              ? new Date(selectedSession.created_at).toLocaleString('id-ID', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  hourCycle: 'h23',
                  timeZone: 'Asia/Jakarta',
                })
              : '-'
          }}
        </span>
      </div>

      <div class="space-y-1 text-sm">
        <p class="text-(--grey-color)">Catatan</p>
        <p class="rounded-xl bg-gray-50 px-4 py-3 text-(--dark-color) whitespace-pre-line">
          {{ selectedSession.notes || '-' }}
        </p>
      </div>

      <div class="space-y-1 text-sm">
        <p class="text-(--grey-color)">Dokumentasi</p>
        <n-image
          v-if="selectedSession.documentation_path"
          :src="baseUrl + selectedSession.documentation_path"
          alt="Dokumentasi sesi mentoring"
          width="140"
          object-fit="cover"
        />
        <p v-else class="text-(--dark-color)">Belum ada dokumentasi.</p>
      </div>

      <n-button
        v-if="getAttendanceState(selectedSession) === 'available'"
        type="success"
        block
        strong
        :loading="attendingId === selectedSession.id"
        @click="handleAttend(selectedSession.id)"
      >
        Catat kehadiran
      </n-button>
    </div>
  </n-modal>
</template>
