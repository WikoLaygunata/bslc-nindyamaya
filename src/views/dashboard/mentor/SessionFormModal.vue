<script setup>
import { computed, ref } from 'vue'
import imageCompression from 'browser-image-compression'
import {
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NImage,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NUpload,
  useMessage,
} from 'naive-ui'

const props = defineProps({
  show: { type: Boolean, required: true },
  isEditing: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  form: { type: Object, required: true },
  documentationPreviewUrl: { type: String, default: '' },
})

const emit = defineEmits([
  'update:show',
  'submit',
  'documentation-change',
  'documentation-remove',
  'update:form-field',
])
const message = useMessage()
const compressingImage = ref(false)

const title = computed(() => (props.isEditing ? 'Edit Session' : 'Create Session'))
const saveLoading = computed(() => props.submitting || compressingImage.value)
const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Finished', value: 'Finished' },
]

function closeModal() {
  emit('update:show', false)
}

function dummyUpload({ onFinish }) {
  onFinish()
}

function toWebpFile(compressed, originalFile) {
  if (compressed instanceof File && compressed.name && compressed.name !== 'blob') {
    return compressed
  }

  const originalName = originalFile?.name ?? 'documentation'
  const baseName = originalName.replace(/\.[^/.]+$/, '') || 'documentation'
  return new File([compressed], `${baseName}.webp`, { type: 'image/webp' })
}

async function handleUploadChange({ file }) {
  const rawFile = file?.file ?? null
  if (!rawFile) {
    emit('documentation-change', null)
    return
  }

  if (!rawFile.type?.startsWith('image/')) {
    message.error('Please choose an image file')
    emit('documentation-change', null)
    return
  }

  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp',
  }

  try {
    compressingImage.value = true
    const compressedFile = await imageCompression(rawFile, options)
    emit('documentation-change', toWebpFile(compressedFile, rawFile))
  } catch {
    message.error('Failed to compress image')
    emit('documentation-change', null)
  } finally {
    compressingImage.value = false
  }
}

function handleUploadRemove() {
  emit('documentation-remove')
}

function updateFormField(key, value) {
  emit('update:form-field', { key, value })
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    :title="title"
    class="max-w-xl"
    @update:show="emit('update:show', $event)"
  >
    <n-form label-placement="top">
      <n-form-item label="Course Name">
        <n-input
          :value="form.course_name"
          placeholder="e.g. Struktur Data"
          @update:value="updateFormField('course_name', $event)"
        />
      </n-form-item>
      <n-form-item label="Platform">
        <n-input
          :value="form.platform"
          placeholder="e.g. Zoom / Google Meet"
          @update:value="updateFormField('platform', $event)"
        />
      </n-form-item>
      <div class="grid gap-3 md:grid-cols-2">
        <n-form-item label="Start Time">
          <n-date-picker
            :value="form.start_time"
            type="datetime"
            clearable
            class="w-full"
            @update:value="updateFormField('start_time', $event)"
          />
        </n-form-item>
        <n-form-item label="End Time">
          <n-date-picker
            :value="form.end_time"
            type="datetime"
            clearable
            class="w-full"
            @update:value="updateFormField('end_time', $event)"
          />
        </n-form-item>
      </div>

      <template v-if="isEditing">
        <n-form-item label="Notes (optional)">
          <n-input
            :value="form.notes"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="Session notes"
            @update:value="updateFormField('notes', $event)"
          />
        </n-form-item>
        <n-form-item label="Status">
          <n-select
            :value="form.status"
            :options="statusOptions"
            @update:value="updateFormField('status', $event)"
          />
        </n-form-item>
        <n-form-item label="Documentation Image (optional)">
          <n-space vertical :size="10" class="w-full">
            <n-upload
              :max="1"
              accept="image/*"
              :show-file-list="false"
              :custom-request="dummyUpload"
              :disabled="compressingImage || submitting"
              @change="handleUploadChange"
              @remove="handleUploadRemove"
            >
              <n-button secondary :loading="compressingImage">
                {{ compressingImage ? 'Compressing...' : 'Choose Image' }}
              </n-button>
            </n-upload>
            <n-image
              v-if="documentationPreviewUrl"
              :src="documentationPreviewUrl"
              width="180"
              object-fit="cover"
            />
          </n-space>
        </n-form-item>
      </template>

      <n-space justify="end">
        <n-button secondary @click="closeModal">Cancel</n-button>
        <n-button type="primary" :loading="saveLoading" :disabled="compressingImage" @click="emit('submit')">
          Save
        </n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>
