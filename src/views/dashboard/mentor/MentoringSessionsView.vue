<script setup>
import { computed, h, onMounted, reactive, ref } from 'vue'
import { CheckmarkCircleOutline, EllipsisVertical } from '@vicons/ionicons5'
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
const activeFilter = ref('all')
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
  const date = startDate.toLocaleDateString('id-ID', {
    day: 'numeric',
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

function getSessionStatusLabel(status) {
  return isFinishedStatus(status) ? 'Selesai' : 'Direncanakan'
}

function getSessionStatusType(status) {
  return isFinishedStatus(status) ? 'success' : 'warning'
}

function handleRowClick(row) {
  selectedSession.value = row
  showDetailModal.value = true
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
    key: 'planned',
    label: 'Direncanakan',
    count: sessions.value.filter((row) => !isFinishedStatus(row.status)).length,
  },
  {
    key: 'finished',
    label: 'Selesai',
    count: sessions.value.filter((row) => isFinishedStatus(row.status)).length,
  },
])

const filteredSessions = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return sessions.value.filter((row) => {
    const matchesFilter =
      activeFilter.value === 'all' ||
      (activeFilter.value === 'planned' && !isFinishedStatus(row.status)) ||
      (activeFilter.value === 'finished' && isFinishedStatus(row.status))
    const searchable = [row.topic, row.location, formatSchedule(row), row.status, row.notes]

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
    width: 220,
    titleAlign: 'center',
    sorter: (a, b) => a.topic.localeCompare(b.topic),
  },
  {
    title: 'Jadwal',
    key: 'schedule',
    titleAlign: 'center',
    width: 220,
    sorter: (a, b) => new Date(a.start_time ?? 0).getTime() - new Date(b.start_time ?? 0).getTime(),
    render: (row) => renderSchedule(row),
  },
  {
    title: 'Platform',
    key: 'location',
    width: 160,
    titleAlign: 'center',
  },
  {
    title: 'Dibuat',
    key: 'created_at',
    width: 130,
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
    title: 'Status sesi',
    key: 'status',
    width: 120,
    align: 'center',
    render: (row) => {
      return h(
        NTag,
        { type: getSessionStatusType(row.status), size: 'small', round: true },
        { default: () => getSessionStatusLabel(row.status) },
      )
    },
  },
  {
    title: 'Kehadiran Mentee',
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
                    { default: () => (item.is_attend ? 'Hadir' : 'Belum hadir') },
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
    title: 'Aksi',
    key: 'actions',
    align: 'center',
    width: 230,
    render: (row) =>
      h(NSpace, { size: 8, justify: 'center', align: 'center', wrap: false }, [
        h(
          NButton,
          {
            size: 'small',
            type: 'success',
            secondary: true,
            disabled: isFinishedStatus(row.status),
            'aria-label': `Selesaikan sesi ${row.topic}`,
            onClick: (event) => {
              event.stopPropagation()
              openFinish(row)
            },
          },
          {
            icon: () =>
              h(NIcon, null, {
                default: () => h(CheckmarkCircleOutline),
              }),
            default: () => (isFinishedStatus(row.status) ? 'Selesai' : 'Selesaikan'),
          },
        ),
        h(
          NDropdown,
          {
            trigger: 'click',
            placement: 'bottom-end',
            options: [
              { label: 'Edit', key: 'action-edit' },
              { label: 'Hapus', key: 'action-delete' },
            ],
            onSelect: (key) => handleDataAction(row, key),
          },
          {
            default: () =>
              h(
                NButton,
                {
                  size: 'small',
                  secondary: true,
                  class: '!rounded-lg !border-gray-200 !px-3',
                  'aria-label': `Buka aksi untuk sesi ${row.topic}`,
                  onClick: (event) => event.stopPropagation(),
                },
                {
                  default: () => 'Aksi',
                },
              ),
          },
        ),
      ]),
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

function isAttended(value) {
  return value === true || value === 1 || ['1', 'true', 'yes'].includes(String(value).toLowerCase())
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
        is_attend: isAttended(entry.is_attend ?? entry.attended ?? entry.isAttend),
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
    message.info('Sesi ini sudah selesai.')
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
      message.success('Sesi berhasil diperbarui.')
    } else {
      await createMentoringSession(payload)
      message.success('Sesi berhasil dibuat.')
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
    message.error('Data sesi tidak valid.')
    return
  }

  try {
    finishing.value = true
    await finishMentoringSession(selectedFinishSession.value.id, payload.formData)
    message.success('Sesi mentoring berhasil diselesaikan.')
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
    title: 'Hapus Sesi',
    content: 'Apakah Anda yakin ingin menghapus sesi mentoring ini?',
    positiveText: 'Hapus',
    negativeText: 'Batal',
    positiveButtonProps: { loading: false },
    onPositiveClick: async () => {
      d.positiveButtonProps.loading = true
      try {
        await deleteMentoringSession(id)
        message.success('Sesi berhasil dihapus.')
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

function formatAttendeesSummary(session) {
  const attendance = session?.attendance ?? []
  const attendedCount = attendance.filter((item) => item.is_attend).length
  return `${attendedCount} dari ${attendance.length}`
}

onMounted(fetchSessions)
</script>

<template>
  <section class="mx-auto max-w-7xl space-y-6">
    <header>
      <p class="text-sm font-medium text-(--green-color)">Rencanakan dan pantau</p>
      <div class="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-(--dark-color)">Sesi Mentoring</h1>
          <p class="mt-1 text-sm text-gray-500">
            Buat sesi, informasikan mentee, dan pantau perkembangannya.
          </p>
        </div>
        <n-button class="!rounded-xl" type="primary" size="large" @click="openCreate">
          Buat sesi
        </n-button>
      </div>
    </header>
    <n-card :bordered="false" class="!rounded-2xl shadow-sm ring-1 ring-gray-100">
      <n-space vertical :size="16">
        <n-input
          v-model:value="search"
          clearable
          round
          aria-label="Cari sesi mentoring"
          placeholder="Cari topik, platform, jadwal, atau catatan"
        />
        <div class="flex flex-wrap gap-2" role="group" aria-label="Filter status sesi">
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
            :scroll-x="1700"
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
              <n-tag :type="getSessionStatusType(session.status)" size="small" round>
                {{ getSessionStatusLabel(session.status) }}
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
            <div class="mt-3 flex items-center justify-between text-sm">
              <span class="text-gray-500">Kehadiran mentee</span>
              <span class="font-medium tabular-nums text-(--dark-color)">
                {{ formatAttendeesSummary(session) }}
              </span>
            </div>
            <details class="mt-3 rounded-xl border border-gray-100 px-3 py-2">
              <summary
                class="cursor-pointer list-none text-sm font-medium text-(--green-color) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--green-color)"
              >
                Lihat catatan sesi
              </summary>
              <p
                class="mt-2 whitespace-pre-line border-t border-gray-100 pt-2 text-sm text-gray-600"
              >
                {{ session.notes || 'Belum ada catatan.' }}
              </p>
            </details>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <n-button
                class="!min-h-11 !rounded-xl"
                secondary
                :aria-label="`Lihat detail sesi ${session.topic}`"
                @click="handleRowClick(session)"
              >
                Detail
              </n-button>
              <n-dropdown
                trigger="click"
                placement="bottom-end"
                :options="[
                  { label: 'Edit', key: 'action-edit' },
                  { label: 'Hapus', key: 'action-delete' },
                ]"
                @select="handleDataAction(session, $event)"
              >
                <n-button
                  class="!min-h-11 !rounded-xl !border-gray-200 !bg-white !text-gray-700 hover:!border-emerald-200 hover:!bg-emerald-50"
                  secondary
                  :aria-label="`Buka aksi untuk sesi ${session.topic}`"
                >
                  <template #icon>
                    <n-icon><ellipsis-vertical /></n-icon>
                  </template>
                  Aksi
                </n-button>
              </n-dropdown>
              <n-button
                class="!col-span-2 !min-h-11 !rounded-xl"
                type="success"
                secondary
                :disabled="isFinishedStatus(session.status)"
                :aria-label="`Selesaikan sesi ${session.topic}`"
                @click="openFinish(session)"
              >
                <template #icon>
                  <n-icon><checkmark-circle-outline /></n-icon>
                </template>
                {{ isFinishedStatus(session.status) ? 'Sesi selesai' : 'Selesaikan sesi' }}
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
    title="Detail Sesi"
    size="small"
    :auto-focus="false"
    style="width: min(420px, calc(100vw - 32px))"
  >
    <div v-if="selectedSession" class="space-y-4 py-1">
      <div class="grid grid-cols-[100px_1fr] gap-x-3 gap-y-3 rounded-xl bg-gray-50 p-4 text-sm">
        <span class="text-(--grey-color)">Topik</span>
        <span class="font-medium text-(--dark-color)">{{ selectedSession.topic || '-' }}</span>

        <span class="text-(--grey-color)">Platform</span>
        <span class="text-(--dark-color)">{{ selectedSession.location || '-' }}</span>

        <span class="text-(--grey-color)">Jadwal</span>
        <span class="text-(--dark-color)">{{ formatSchedule(selectedSession) }}</span>

        <span class="text-(--grey-color)">Status sesi</span>
        <span class="text-(--dark-color)">{{ getSessionStatusLabel(selectedSession.status) }}</span>

        <span class="text-(--grey-color)">Kehadiran</span>
        <span class="text-(--dark-color)"
          >{{ formatAttendeesSummary(selectedSession) }} mentee hadir</span
        >

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

      <div class="rounded-xl border border-gray-100 px-4 py-3">
        <p class="text-sm font-semibold text-(--green-color)">Catatan sesi</p>
        <p class="mt-2 whitespace-pre-line border-t border-gray-100 pt-3 text-sm text-(--dark-color)">
          {{ selectedSession.notes || 'Belum ada catatan.' }}
        </p>
      </div>

      <details class="rounded-xl border border-gray-100 px-4 py-3">
        <summary
          class="cursor-pointer text-sm font-semibold text-(--green-color) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--green-color)"
        >
          Daftar kehadiran ({{ selectedSession.attendance.length }})
        </summary>
        <div class="mt-3 space-y-4 border-t border-gray-100 pt-3">
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Hadir ({{ selectedSession.attendance.filter((item) => item.is_attend).length }})
            </p>
            <ul
              v-if="selectedSession.attendance.some((item) => item.is_attend)"
              class="space-y-1.5"
            >
              <li
                v-for="(item, index) in selectedSession.attendance.filter(
                  (entry) => entry.is_attend,
                )"
                :key="`present-${item.mentee_id ?? item.name}-${index}`"
                class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-(--dark-color)"
              >
                {{ item.name }}
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500">Belum ada mentee yang hadir.</p>
          </div>
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Tidak hadir ({{
                selectedSession.attendance.filter((item) => !item.is_attend).length
              }})
            </p>
            <ul
              v-if="selectedSession.attendance.some((item) => !item.is_attend)"
              class="space-y-1.5"
            >
              <li
                v-for="(item, index) in selectedSession.attendance.filter(
                  (entry) => !entry.is_attend,
                )"
                :key="`absent-${item.mentee_id ?? item.name}-${index}`"
                class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-(--dark-color)"
              >
                {{ item.name }}
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500">Tidak ada mentee yang absen.</p>
          </div>
        </div>
      </details>

      <div class="space-y-1 text-sm">
        <p class="text-(--grey-color)">Dokumentasi</p>
        <n-image
          v-if="selectedSession.documentation_path"
          :src="baseUrl + selectedSession.documentation_path"
          alt="Dokumentasi sesi mentoring"
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
