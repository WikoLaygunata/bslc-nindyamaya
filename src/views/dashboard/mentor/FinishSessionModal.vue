<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { NButton, NCheckbox, NForm, NFormItem, NImage, NInput, NModal, NSpace, NUpload, useMessage } from 'naive-ui'

const props = defineProps({
  show: { type: Boolean, required: true },
  session: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['update:show', 'submit'])
const message = useMessage()

const form = reactive({
  notes: '',
  documentationFile: null,
})

const menteeAttendance = reactive([])
const documentationPreviewUrl = ref('')

function resolveMenteeId(item) {
  return item?.mentee_id
    ?? item?.nindyamaya_user_id
    ?? item?.user_id
    ?? item?.menteeId
    ?? item?.mentee?.id
    ?? item?.mentee?.nindyamaya_user_id
    ?? item?.user?.id
    ?? item?.id
}

function clearPreviewUrl() {
  if (documentationPreviewUrl.value) {
    URL.revokeObjectURL(documentationPreviewUrl.value)
    documentationPreviewUrl.value = ''
  }
}

watch(
  () => props.show,
  (show) => {
    if (!show || !props.session) {
      return
    }
    form.notes = props.session.notes ?? ''
    form.documentationFile = null
    clearPreviewUrl()
    menteeAttendance.splice(0, menteeAttendance.length)
    const attendanceSource = props.session.attendance ?? props.session.raw?.attendance ?? []
    for (const item of attendanceSource) {
      const menteeId = resolveMenteeId(item)
      menteeAttendance.push({
        mentee_id: menteeId,
        name: item.name ?? item.full_name ?? item.mentee?.name ?? item.user?.name ?? `Mentee #${menteeId ?? '-'}`,
        is_attend: Boolean(item.is_attend ?? item.attended ?? item.isAttend),
      })
    }
  },
)

function dummyUpload({ onFinish }) {
  onFinish()
}

function handleUploadChange({ file }) {
  clearPreviewUrl()
  form.documentationFile = file?.file ?? null
  documentationPreviewUrl.value = form.documentationFile
    ? URL.createObjectURL(form.documentationFile)
    : ''
}

function closeModal() {
  emit('update:show', false)
}

function submitFinish() {
  if (!form.documentationFile) {
    message.error('Documentation image is required')
    return
  }

  const validAttendance = menteeAttendance
    .map((item) => ({
      mentee_id: resolveMenteeId(item),
      is_attend: Boolean(item.is_attend),
    }))
    .filter((item) => item.mentee_id != null)

  if (!validAttendance.length) {
    message.error('Attendance list is required')
    return
  }

  const formData = new FormData()
  formData.append('notes', form.notes ?? '')
  formData.append('documentation_image', form.documentationFile)
  for (let index = 0; index < validAttendance.length; index += 1) {
    const item = validAttendance[index]
    formData.append(`attendance[${index}][mentee_id]`, String(item.mentee_id))
    formData.append(`attendance[${index}][is_attend]`, item.is_attend ? '1' : '0')
  }

  emit('submit', {
    formData,
  })
}

onBeforeUnmount(clearPreviewUrl)
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    title="Finish Class"
    style="width: min(560px, calc(100vw - 32px))"
    @update:show="emit('update:show', $event)"
  >
    <n-form label-placement="top">
      <n-form-item label="Notes">
        <n-input
          v-model:value="form.notes"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="Add final class notes"
        />
      </n-form-item>

      <n-form-item label="Documentation Image">
        <n-space vertical :size="10" class="w-full">
          <n-upload
            :max="1"
            accept="image/*"
            :show-file-list="false"
            :custom-request="dummyUpload"
            @change="handleUploadChange"
          >
            <n-button secondary>Choose Image</n-button>
          </n-upload>
          <n-image
            v-if="documentationPreviewUrl"
            :src="documentationPreviewUrl"
            width="220"
            object-fit="cover"
          />
        </n-space>
      </n-form-item>

      <n-form-item label="Mentee Attendance">
        <n-space vertical :size="8" class="w-full">
          <n-checkbox
            v-for="(item, idx) in menteeAttendance"
            :key="item.mentee_id ?? `unknown-${idx}`"
            v-model:checked="item.is_attend"
          >
            {{ item.name }}
          </n-checkbox>
          <p v-if="!menteeAttendance.length" class="text-sm text-(--grey-color)">
            No mentee data available for this session.
          </p>
        </n-space>
      </n-form-item>

      <n-space justify="end">
        <n-button secondary @click="closeModal">Cancel</n-button>
        <n-button type="primary" :loading="submitting" @click="submitFinish">Finish Class</n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>
