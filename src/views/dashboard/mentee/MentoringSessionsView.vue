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
  const date = startDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const startTime = startDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const endTime = endDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${date} (${startTime} - ${endTime})`
}

function handleRowClick(row) {
  selectedSession.value = row
  showSessionModal.value = true
}

function rowProps(row) {
  return {
    style: 'cursor: pointer;',
    onClick: () => handleRowClick(row),
  }
}

const filteredSessions = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) {
    return sessions.value
  }

  return sessions.value.filter((row) => {
    const searchable = [
      row.topic,
      formatSchedule(row),
      row.created_at ? new Date(row.created_at).toLocaleString() : '',
      getAttendanceState(row),
      row.notes,
      row.status,
    ]

    return searchable.some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(keyword),
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
    message.success('Attend mentoring session success')
    await fetchSessions()
  } catch (error) {
    message.error(error.message)
  } finally {
    attendingId.value = null
  }
}

const columns = [
  {
    title: 'No',
    key: 'no',
    width: 50,
    align: 'center',
    render: (_, index) => index + 1,
  },
  {
    title: 'Course',
    key: 'topic',
    width: 200,
    titleAlign: 'center',
    sorter: (a, b) => a.topic.localeCompare(b.topic),
  },
  {
    title: 'Schedule',
    key: 'schedule',
    width: 200,
    titleAlign: 'center',
    sorter: (a, b) => new Date(a.start_time ?? 0).getTime() - new Date(b.start_time ?? 0).getTime(),
    render: (row) => formatSchedule(row),
  },
  {
    title: 'Platform',
    key: 'location',
    width: 140,
    titleAlign: 'center',
  },
  {
    title: 'Created At',
    key: 'created_at',
    width: 120,
    titleAlign: 'center',
    render: (row) =>
      row.created_at
        ? new Date(row.created_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '-',
  },
  {
    title: 'Notes',
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
    title: 'Documentation',
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
    title: 'Session Status',
    key: 'session_status',
    width: 130,
    align: 'center',
    render: (row) => {
      const status = String(row.status ?? 'Pending')
      const type = status === 'Finished' ? 'success' : 'warning'
      return h(NTag, { type, size: 'small', round: true }, { default: () => status })
    },
  },
  {
    title: 'Status',
    key: 'attend',
    width: 130,
    align: 'center',
    render: (row) => {
      const state = getAttendanceState(row)

      if (state === 'attended') {
        return h(
          NTag,
          { type: 'success', size: 'small', round: true },
          { default: () => 'Attended' },
        )
      }

      if (state === 'missed') {
        return h(NTag, { type: 'error', size: 'small', round: true }, { default: () => 'Missed' })
      }

      if (state === 'upcoming') {
        return h(
          NTag,
          { type: 'warning', size: 'small', round: true },
          { default: () => 'Upcoming' },
        )
      }

      if (state === 'unavailable') {
        return h(NTag, { size: 'small', round: true }, { default: () => 'Unavailable' })
      }

      return h(
        NButton,
        {
          size: 'small',
          type: 'success', // changed to 'success' for a more recognizable/positive color
          strong: true, // make the button stand out more
          ghost: false, // ensure solid color
          loading: attendingId.value === row.id,
          style: {
            color: '#fff',
            backgroundColor: '#28a745', // green, strong positive CTA
            borderColor: '#28a745',
            letterSpacing: '0.5px',
          },
          onClick: (event) => {
            event.stopPropagation()
            handleAttend(row.id)
          },
        },
        { default: () => 'Attend Class' },
      )
    },
  },
]

onMounted(fetchSessions)
</script>

<template>
  <n-card title="Mentoring Sessions" :bordered="false" class="rounded-2xl shadow-sm">
    <n-space vertical :size="14">
      <p class="text-sm text-(--grey-color)">
        View available mentoring sessions and mark your attendance.
      </p>
      <n-input
        v-model:value="search"
        clearable
        placeholder="Search course, schedule, notes, or status"
      />
      <n-data-table
        :columns="columns"
        :data="filteredSessions"
        :loading="loading"
        :row-props="rowProps"
        :single-line="false"
        size="small"
        :scroll-x="1500"
      />
    </n-space>
  </n-card>

  <n-modal
    v-model:show="showSessionModal"
    :auto-focus="false"
    preset="card"
    title="Session Detail"
    size="small"
    style="width: min(420px, calc(100vw - 32px))"
  >
    <div v-if="selectedSession" class="space-y-4 py-1">
      <div class="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
        <span class="text-(--grey-color)">Course</span>
        <span class="font-medium text-(--dark-color)">{{ selectedSession.topic || '-' }}</span>

        <span class="text-(--grey-color)">Schedule</span>
        <span class="text-(--dark-color)">{{ formatSchedule(selectedSession) }}</span>

        <span class="text-(--grey-color)">Platform</span>
        <span class="text-(--dark-color)">{{ selectedSession.location || '-' }}</span>

        <span class="text-(--grey-color)">Session Status</span>
        <span class="text-(--dark-color)">{{ selectedSession.status || '-' }}</span>

        <span class="text-(--grey-color)">Attendance</span>
        <span class="text-(--dark-color)">
          {{
            getAttendanceState(selectedSession).charAt(0).toUpperCase() +
            getAttendanceState(selectedSession).slice(1)
          }}
        </span>

        <span class="text-(--grey-color)">Created At</span>
        <span class="text-(--dark-color)">
          {{
            selectedSession.created_at ? new Date(selectedSession.created_at).toLocaleString() : '-'
          }}
        </span>
      </div>

      <div class="space-y-1 text-sm">
        <p class="text-(--grey-color)">Notes</p>
        <p class="rounded-md bg-gray-50 px-3 py-2 text-(--dark-color) whitespace-pre-line">
          {{ selectedSession.notes || '-' }}
        </p>
      </div>

      <div class="space-y-1 text-sm">
        <p class="text-(--grey-color)">Documentation</p>
        <n-image
          v-if="selectedSession.documentation_path"
          :src="baseUrl + selectedSession.documentation_path"
          width="140"
          object-fit="cover"
        />
        <p v-else class="text-(--dark-color)">-</p>
      </div>

      <n-button
        v-if="getAttendanceState(selectedSession) === 'available'"
        type="success"
        block
        strong
        :loading="attendingId === selectedSession.id"
        @click="handleAttend(selectedSession.id)"
      >
        Attend Class
      </n-button>
    </div>
  </n-modal>
</template>
