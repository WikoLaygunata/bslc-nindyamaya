<script setup>
import { computed, h, onMounted, ref } from 'vue'
import { NButton, NCard, NDataTable, NImage, NInput, NSpace, useMessage } from 'naive-ui'
import { getMentees } from '@/api/api'
import { getWhatsAppUrl } from '@/utils/whatsapp'

const message = useMessage()
const loading = ref(false)
const data = ref([])
const search = ref('')
const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ''

const columns = [
  { title: 'No.', key: 'no', width: 50, align: 'center', render: (_, index) => index + 1 },
  {
    title: 'Profil',
    key: 'profile_path',
    width: 100,
    align: 'center',
    render: (row) => {
      if (!row.profile_path) return '-'
      const imgSrc = row.profile_path.startsWith('http')
        ? row.profile_path
        : imageBaseUrl + row.profile_path

      return h(NImage, {
        src: imgSrc,
        alt: `Foto ${row.name || 'mentee'}`,
        width: 64,
        height: 64,
        objectFit: 'cover',
        style: { borderRadius: '8px' },
      })
    },
  },
  {
    title: 'Nama',
    key: 'name',
    titleAlign: 'center',
    sorter: (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')),
  },
  { title: 'Email', key: 'email', titleAlign: 'center' },
  { title: 'NIM', key: 'nim', titleAlign: 'center' },
  {
    title: 'Wilayah',
    key: 'region',
    titleAlign: 'center',
    sorter: (a, b) => String(a.region ?? '').localeCompare(String(b.region ?? '')),
  },
  {
    title: 'Jurusan',
    key: 'major',
    titleAlign: 'center',
    sorter: (a, b) => String(a.major ?? '').localeCompare(String(b.major ?? '')),
  },
  { title: 'Telepon', key: 'phone', titleAlign: 'center' },
  {
    title: 'Aksi',
    key: 'actions',
    align: 'center',
    render: (row) => {
      const url = getWhatsAppUrl(row.phone)
      if (!url) return '-'

      return h(
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          class:
            'inline-flex min-h-9 items-center rounded-lg bg-emerald-600 px-3 text-sm font-medium !text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700',
          'aria-label': `Hubungi ${row.name || 'mentee'} melalui WhatsApp`,
        },
        'WhatsApp',
      )
    },
  },
]

function getInitials(name) {
  return (
    String(name || 'Mentee')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'M'
  )
}

function getProfileImage(row) {
  if (!row.profile_path) return ''
  return row.profile_path.startsWith('http') ? row.profile_path : imageBaseUrl + row.profile_path
}

const filteredData = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) {
    return data.value
  }

  return data.value.filter((row) =>
    [row.name, row.region, row.major, row.phone].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(keyword),
    ),
  )
})

function normalizePayload(payload) {
  return payload?.data ?? payload ?? []
}

async function fetchMentees() {
  try {
    loading.value = true
    const payload = await getMentees()
    data.value = normalizePayload(payload)
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMentees)
</script>

<template>
  <section class="mx-auto max-w-7xl space-y-6">
    <header>
      <p class="text-sm font-medium text-(--green-color)">Komunitas mentee</p>
      <div class="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-(--dark-color)">Mentee Saya</h1>
        </div>
        <span
          class="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-(--green-color)"
        >
          {{ filteredData.length }} mentee
        </span>
      </div>
    </header>

    <n-card :bordered="false" class="!rounded-2xl shadow-sm ring-1 ring-gray-100">
      <n-space vertical :size="16">
        <n-input
          v-model:value="search"
          clearable
          round
          aria-label="Cari mentee"
          placeholder="Cari nama, wilayah, jurusan, atau telepon"
        />
        <div class="hidden overflow-hidden rounded-xl border border-gray-100 md:block">
          <n-data-table
            :columns="columns"
            :data="filteredData"
            :loading="loading"
            :single-line="false"
            size="small"
            :scroll-x="1000"
          />
        </div>
        <div class="grid gap-3 sm:grid-cols-2 md:hidden" aria-label="Daftar mentee">
          <article
            v-for="mentee in filteredData"
            :key="mentee.id ?? mentee.email ?? mentee.name"
            class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div
                v-if="getProfileImage(mentee)"
                class="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200"
              >
                <img
                  :src="getProfileImage(mentee)"
                  :alt="`Foto ${mentee.name || 'mentee'}`"
                  class="block h-full w-full object-cover"
                  width="48"
                  height="48"
                />
              </div>
              <div
                v-else
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-(--green-color)"
                aria-hidden="true"
              >
                {{ getInitials(mentee.name) }}
              </div>
              <div class="min-w-0">
                <h2 class="truncate font-semibold text-(--dark-color)">{{ mentee.name || '-' }}</h2>
                <p class="break-all text-xs text-gray-500">{{ mentee.email || '-' }}</p>
              </div>
            </div>
            <dl class="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-sm">
              <div>
                <dt class="text-xs text-gray-400">NIM</dt>
                <dd class="mt-1 break-words font-medium text-(--dark-color)">
                  {{ mentee.nim || '-' }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-gray-400">Wilayah</dt>
                <dd class="mt-1 break-words font-medium text-(--dark-color)">
                  {{ mentee.region || '-' }}
                </dd>
              </div>
              <div class="col-span-2">
                <dt class="text-xs text-gray-400">Jurusan</dt>
                <dd class="mt-1 break-words font-medium text-(--dark-color)">
                  {{ mentee.major || '-' }}
                </dd>
              </div>
              <div class="col-span-2">
                <dt class="text-xs text-gray-400">Telepon</dt>
                <dd class="mt-1 break-words font-medium text-(--dark-color)">
                  {{ mentee.phone || '-' }}
                </dd>
              </div>
            </dl>
            <n-button
              v-if="getWhatsAppUrl(mentee.phone)"
              tag="a"
              :href="getWhatsAppUrl(mentee.phone)"
              target="_blank"
              rel="noopener noreferrer"
              class="!mt-4 !min-h-11 !w-full !rounded-xl"
              type="success"
              :aria-label="`Hubungi ${mentee.name || 'mentee'} melalui WhatsApp`"
            >
              WhatsApp
            </n-button>
          </article>
          <div
            v-if="!loading && !filteredData.length"
            class="col-span-full rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500"
          >
            Mentee tidak ditemukan.
          </div>
        </div>
      </n-space>
    </n-card>
  </section>
</template>
