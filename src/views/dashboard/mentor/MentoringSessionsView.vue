<script setup>
import { h, onMounted, reactive, ref } from 'vue'
import { EllipsisVertical } from '@vicons/ionicons5'
import {
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NDropdown,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NSpace,
  useDialog,
  useMessage,
} from 'naive-ui'
import {
  createMentoringSession,
  deleteMentoringSession,
  getMentoringSessions,
  updateMentoringSession,
} from '@/api/api'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitting = ref(false)
const sessions = ref([])
const showModal = ref(false)
const editingId = ref(null)

const form = reactive({
  course_name: '',
  platform: '',
  start_time: null,
  end_time: null,
})

const columns = [
  {
    title: 'No',
    key: 'no',
    width: 60,
    render: (_, index) => index + 1,
    align: 'center',
  },
  { title: 'Course', key: 'topic', width: 220 },
  { title: 'Platform', key: 'location', width: 140 },
  {
    title: 'Schedule',
    key: 'schedule',
    width: 200,
    render: (row) => {
      if (!row.start_time || !row.end_time) {
        return '-'
      }

      const startDate = new Date(row.start_time)
      const endDate = new Date(row.end_time)
      const date = startDate.toLocaleDateString()
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
    },
  },
  {
    title: 'Created At',
    key: 'created_at',
    width: 170,
    render: (row) =>
      row.created_at
        ? new Date(row.created_at).toLocaleString([], {
            dateStyle: 'short',
            timeStyle: 'short',
            hour12: false,
          })
        : '-',
  },
  {
    title: 'Attendees',
    key: 'attendance',
    width: 280,
    render: (row) => {
      if (!row.attendance.length) {
        return '-'
      }

      return h(
        NSpace,
        { vertical: true, size: 6 },
        {
          default: () =>
            row.attendance.map((item) =>
              h(
                'div',
                {
                  class: 'flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2 py-1',
                },
                [
                  h('span', { class: 'text-sm text-(--dark-color)' }, item.name),
                  h(
                    NButton,
                    { size: 'tiny', tertiary: true, type: item.is_attend ? 'success' : 'warning' },
                    { default: () => (item.is_attend ? 'Attend' : 'Not Attend') },
                  ),
                ],
              ),
            ),
        },
      )
    },
  },
  // { title: 'Notes', key: 'notes' },
  {
    title: 'Action',
    key: 'actions',
    width: 90,
    render: (row) =>
      h(
        NDropdown,
        {
          trigger: 'click',
          placement: 'bottom-end',
          options: [
            { label: 'Edit', key: 'action-edit' },
            { label: 'Delete', key: 'action-delete' },
          ],
          onSelect: (key) => handleDataAction(row, key),
        },
        {
          default: () =>
            h(
              NButton,
              { size: 'small', tertiary: true },
              {
                icon: () =>
                  h(NIcon, null, {
                    default: () => h(EllipsisVertical),
                  }),
              },
            ),
        },
      ),
  },
]

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
    attendance: item.attendance ?? item.mentees ?? [],
    raw: item,
  }
}

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

function resetForm() {
  form.course_name = ''
  form.platform = ''
  form.start_time = null
  form.end_time = null
}

function openCreate() {
  editingId.value = null
  resetForm()
  showModal.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.course_name = row.topic === '-' ? '' : row.topic
  form.platform = row.location === '-' ? '' : row.location
  form.start_time = row.start_time ? new Date(row.start_time).getTime() : null
  form.end_time = row.end_time ? new Date(row.end_time).getTime() : null
  showModal.value = true
}

function mapFormPayload() {
  const toLocalDateTime = (value) => {
    if (!value) {
      return null
    }

    const date = new Date(value)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  return {
    course_name: form.course_name,
    platform: form.platform,
    start_time: toLocalDateTime(form.start_time),
    end_time: toLocalDateTime(form.end_time),
  }
}

async function submitForm() {
  try {
    submitting.value = true
    const payload = mapFormPayload()
    if (editingId.value) {
      await updateMentoringSession(editingId.value, payload)
      message.success('Session updated')
    } else {
      await createMentoringSession(payload)
      message.success('Session created')
    }
    showModal.value = false
    await fetchSessions()
  } catch (error) {
    message.error(error.message)
  } finally {
    submitting.value = false
  }
}

function confirmDelete(id) {
  const d = dialog.warning({
    title: 'Delete Session',
    content: 'Are you sure you want to delete this mentoring session?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    positiveButtonProps: { loading: false },
    onPositiveClick: async () => {
      d.positiveButtonProps.loading = true
      try {
        await deleteMentoringSession(id)
        message.success('Session deleted')
        await fetchSessions()
      } catch (error) {
        message.error(error.message)
      } finally {
        d.positiveButtonProps.loading = false
      }
    },
  })
}

function handleDataAction(row, key) {
  if (key === 'action-edit') {
    openEdit(row)
    return
  }
  if (key === 'action-delete') {
    confirmDelete(row.id)
  }
}

onMounted(fetchSessions)
</script>

<template>
  <n-card title="Mentoring Sessions" :bordered="false" class="rounded-2xl shadow-sm">
    <n-space vertical :size="14">
      <n-space justify="space-between">
        <p class="text-sm text-(--grey-color)">Manage mentoring sessions here.</p>
        <n-button type="primary" @click="openCreate">Create Session</n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="sessions"
        :loading="loading"
        :single-line="false"
        size="small"
        :scroll-x="1100"
      />
    </n-space>
  </n-card>

  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="editingId ? 'Edit Session' : 'Create Session'"
    class="max-w-xl"
  >
    <n-form label-placement="top">
      <n-form-item label="Course Name">
        <n-input v-model:value="form.course_name" placeholder="e.g. Struktur Data" />
      </n-form-item>
      <n-form-item label="Platform">
        <n-input v-model:value="form.platform" placeholder="e.g. Zoom / Google Meet" />
      </n-form-item>
      <div class="grid gap-3 md:grid-cols-2">
        <n-form-item label="Start Time">
          <n-date-picker v-model:value="form.start_time" type="datetime" clearable class="w-full" />
        </n-form-item>
        <n-form-item label="End Time">
          <n-date-picker v-model:value="form.end_time" type="datetime" clearable class="w-full" />
        </n-form-item>
      </div>
      <n-space justify="end">
        <n-button secondary @click="showModal = false">Cancel</n-button>
        <n-button type="primary" :loading="submitting" @click="submitForm">Save</n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>
