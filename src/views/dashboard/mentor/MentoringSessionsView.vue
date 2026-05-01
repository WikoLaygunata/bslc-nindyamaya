<script setup>
import { computed, h, onMounted, reactive, ref } from 'vue'
import { EllipsisVertical } from '@vicons/ionicons5'
import {
  NButton,
  NCard,
  NDataTable,
  NDropdown,
  NIcon,
  NImage,
  NInput,
  NModal,
  NSpace,
  NTag,
  useDialog,
  useMessage,
} from 'naive-ui'
import {
  createMentoringSession,
  deleteMentoringSession,
  finishMentoringSession,
  getMentoringSessions,
  updateMentoringSession,
} from '@/api/api'
import SessionFormModal from './SessionFormModal.vue'
import FinishSessionModal from './FinishSessionModal.vue'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitting = ref(false)
const finishing = ref(false)
const sessions = ref([])
const search = ref('')
const showModal = ref(false)
const showDetailModal = ref(false)
const showFinishModal = ref(false)
const editingId = ref(null)
const selectedSession = ref(null)
const selectedFinishSession = ref(null)
const documentationFile = ref(null)
const documentationPreviewUrl = ref('')
const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ''

const form = reactive({
  course_name: '',
  platform: '',
  start_time: null,
  end_time: null,
  notes: '',
  status: 'Pending',
})

function isFinishedStatus(status) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
  return normalized === 'finished'
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
  showDetailModal.value = true
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
    const searchable = [row.topic, formatSchedule(row), row.status]

    return searchable.some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(keyword),
    )
  })
})

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
    width: 220,
    titleAlign: 'center',
    sorter: (a, b) => a.topic.localeCompare(b.topic),
  },
  {
    title: 'Schedule',
    key: 'schedule',
    titleAlign: 'center',
    width: 220,
    sorter: (a, b) => new Date(a.start_time ?? 0).getTime() - new Date(b.start_time ?? 0).getTime(),
    render: (row) => formatSchedule(row),
  },
  {
    title: 'Platform',
    key: 'location',
    width: 160,
    titleAlign: 'center',
  },
  {
    title: 'Created At',
    key: 'created_at',
    width: 130,
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
    render: (row) => {
      return row.documentation_path
        ? h(NImage, {
            src: baseUrl + row.documentation_path,
            width: 48,
            height: 48,
            objectFit: 'cover',
            previewDisabled: true,
          })
        : '-'
    },
  },
  {
    title: 'Status',
    key: 'status',
    width: 120,
    align: 'center',
    render: (row) => {
      const status = String(row.status ?? 'Pending')
      const type = isFinishedStatus(status) ? 'success' : 'warning'
      return h(NTag, { type, size: 'small', round: true }, { default: () => status })
    },
  },
  {
    title: 'Attendees',
    key: 'attendance',
    width: 260,
    titleAlign: 'center',
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
    align: 'center',
    width: 80,
    render: (row) =>
      h(
        NDropdown,
        {
          trigger: 'click',
          placement: 'bottom-end',
          options: [
            { label: 'Edit', key: 'action-edit' },
            { label: 'Finish Class', key: 'action-finish', disabled: isFinishedStatus(row.status) },
            { label: 'Delete', key: 'action-delete' },
          ],
          onSelect: (key) => handleDataAction(row, key),
        },
        {
          default: () =>
            h(
              NButton,
              {
                size: 'small',
                tertiary: true,
                onClick: (event) => event.stopPropagation(),
              },
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

function resolveMenteeId(item) {
  return (
    item?.mentee_id ??
    item?.nindyamaya_user_id ??
    item?.user_id ??
    item?.menteeId ??
    item?.mentee?.id ??
    item?.mentee?.nindyamaya_user_id ??
    item?.user?.id ??
    item?.id
  )
}

function normalizeSession(item) {
  const mappedAttendance = (item.attendance ?? item.mentees ?? item.participants ?? []).map(
    (entry) => {
      const menteeId = resolveMenteeId(entry)

      return {
        mentee_id: menteeId,
        name:
          entry.name ??
          entry.full_name ??
          entry.mentee?.name ??
          entry.mentee?.full_name ??
          entry.user?.name ??
          `Mentee #${menteeId ?? '-'}`,
        is_attend: Boolean(entry.is_attend ?? entry.attended ?? entry.isAttend),
      }
    },
  )

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
    attendance: mappedAttendance,
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
  form.notes = ''
  form.status = 'Pending'
  handleDocumentationRemove()
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
  form.notes = row.notes ?? ''
  form.status = row.status ?? 'Pending'
  documentationFile.value = null
  documentationPreviewUrl.value = row.documentation_path ?? ''
  showModal.value = true
}

function openFinish(row) {
  if (isFinishedStatus(row?.status)) {
    message.info('This session is already finished')
    return
  }
  selectedFinishSession.value = row
  showFinishModal.value = true
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

  const basePayload = {
    course_name: form.course_name,
    platform: form.platform,
    start_time: toLocalDateTime(form.start_time),
    end_time: toLocalDateTime(form.end_time),
  }

  if (!editingId.value) {
    return basePayload
  }

  const payload = new FormData()
  payload.append('course_name', basePayload.course_name)
  payload.append('platform', basePayload.platform)
  if (basePayload.start_time) {
    payload.append('start_time', basePayload.start_time)
  }
  if (basePayload.end_time) {
    payload.append('end_time', basePayload.end_time)
  }
  payload.append('notes', form.notes || '')
  payload.append('status', form.status || 'Pending')
  if (documentationFile.value) {
    payload.append('documentation_image', documentationFile.value)
  }
  return payload
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

function handleDocumentationChange(file) {
  if (documentationPreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(documentationPreviewUrl.value)
  }
  documentationFile.value = file
  documentationPreviewUrl.value = file ? URL.createObjectURL(file) : ''
}

function handleDocumentationRemove() {
  if (documentationPreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(documentationPreviewUrl.value)
  }
  documentationFile.value = null
  documentationPreviewUrl.value = ''
}

function handleFormFieldUpdate({ key, value }) {
  if (!(key in form)) {
    return
  }
  form[key] = value
}

async function submitFinishSession(payload) {
  if (!selectedFinishSession.value) {
    return
  }

  if (!(payload?.formData instanceof FormData)) {
    message.error('Invalid finish session payload')
    return
  }

  try {
    finishing.value = true
    await finishMentoringSession(selectedFinishSession.value.id, payload.formData)
    message.success('Mentoring session finished successfully')
    showFinishModal.value = false
    selectedFinishSession.value = null
    await fetchSessions()
  } catch (error) {
    message.error(error.message)
  } finally {
    finishing.value = false
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
    return
  }
  if (key === 'action-finish') {
    openFinish(row)
  }
}

function formatAttendeesSummary(session) {
  const attendance = session?.attendance ?? []
  const attendedCount = attendance.filter((item) => item.is_attend).length
  return `${attendedCount} of ${attendance.length}`
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
      <n-input v-model:value="search" clearable placeholder="Search course, status, or schedule" />

      <n-data-table
        :columns="columns"
        :data="filteredSessions"
        :loading="loading"
        :row-props="rowProps"
        :single-line="false"
        size="small"
        :scroll-x="1700"
      />
    </n-space>
  </n-card>

  <session-form-modal
    :show="showModal"
    :is-editing="Boolean(editingId)"
    :submitting="submitting"
    :form="form"
    :documentation-preview-url="documentationPreviewUrl"
    @update:show="showModal = $event"
    @update:form-field="handleFormFieldUpdate"
    @documentation-change="handleDocumentationChange"
    @documentation-remove="handleDocumentationRemove"
    @submit="submitForm"
  />

  <n-modal
    v-model:show="showDetailModal"
    preset="card"
    title="Session Detail"
    size="small"
    :auto-focus="false"
    style="width: min(420px, calc(100vw - 32px))"
  >
    <div v-if="selectedSession" class="space-y-4 py-1">
      <div class="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
        <span class="text-(--grey-color)">Course</span>
        <span class="font-medium text-(--dark-color)">{{ selectedSession.topic || '-' }}</span>

        <span class="text-(--grey-color)">Platform</span>
        <span class="text-(--dark-color)">{{ selectedSession.location || '-' }}</span>

        <span class="text-(--grey-color)">Schedule</span>
        <span class="text-(--dark-color)">{{ formatSchedule(selectedSession) }}</span>

        <span class="text-(--grey-color)">Status</span>
        <span class="text-(--dark-color)">{{ selectedSession.status || '-' }}</span>

        <span class="text-(--grey-color)">Attendees</span>
        <span class="text-(--dark-color)">{{ formatAttendeesSummary(selectedSession) }}</span>

        <span class="text-(--grey-color)">Created At</span>
        <span class="text-(--dark-color)">
          {{
            selectedSession.created_at
              ? new Date(selectedSession.created_at).toLocaleString([], {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  hour12: false,
                })
              : '-'
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
    </div>
  </n-modal>

  <finish-session-modal
    :show="showFinishModal"
    :session="selectedFinishSession"
    :submitting="finishing"
    @update:show="showFinishModal = $event"
    @submit="submitFinishSession"
  />
</template>
