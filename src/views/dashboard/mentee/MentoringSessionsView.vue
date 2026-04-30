<script setup>
import { computed, h, onMounted, ref } from 'vue'
import { NButton, NCard, NDataTable, NInput, NModal, NSpace, NTag, useMessage } from 'naive-ui'
import { attendMentoringSession, getMentoringSessions } from '@/api/api'

const message = useMessage()
const loading = ref(false)
const attendingId = ref(null)
const sessions = ref([])
const search = ref('')
const selectedSession = ref(null)
const showSessionModal = ref(false)

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
          type: 'primary',
          tertiary: true,
          loading: attendingId.value === row.id,
          onClick: (event) => {
            event.stopPropagation()
            handleAttend(row.id)
          },
        },
        { default: () => 'Attend' },
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
      <n-input v-model:value="search" clearable placeholder="Search course, schedule, or status" />
      <n-data-table
        :columns="columns"
        :data="filteredSessions"
        :loading="loading"
        :row-props="rowProps"
        :single-line="false"
        size="small"
        :scroll-x="1100"
      />
    </n-space>
  </n-card>

  <n-modal
    v-model:show="showSessionModal"
    preset="card"
    title="Session Detail"
    size="small"
    style="width: min(420px, calc(100vw - 32px))"
  >
    <hr class="mb-2" />
    <div v-if="selectedSession" class="space-y-2 text-sm py-2">
      <p><strong>Course:</strong> {{ selectedSession.topic || '-' }}</p>
      <p><strong>Schedule:</strong> {{ formatSchedule(selectedSession) }}</p>
      <p><strong>Platform:</strong> {{ selectedSession.location || '-' }}</p>
      <p>
        <strong>Created At:</strong>
        {{
          selectedSession.created_at ? new Date(selectedSession.created_at).toLocaleString() : '-'
        }}
      </p>
      <p><strong>Status:</strong> {{ getAttendanceState(selectedSession) }}</p>
    </div>
  </n-modal>
</template>
