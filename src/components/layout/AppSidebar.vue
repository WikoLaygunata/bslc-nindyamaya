<script setup>
import { computed, h } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ExitOutline,
  HomeOutline,
  PeopleOutline,
  PersonCircleOutline,
  SchoolOutline,
} from '@vicons/ionicons5'
import { NButton, NIcon, NMenu, NTag } from 'naive-ui'

const props = defineProps({
  role: {
    type: String,
    default: 'mentee',
  },
  name: {
    type: String,
    default: 'Pengguna',
  },
})

defineEmits(['logout'])

const route = useRoute()

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed(() => {
  const baseItems = [
    {
      label: () => h(RouterLink, { to: { name: 'home' } }, { default: () => 'Beranda' }),
      key: 'home',
      icon: renderIcon(HomeOutline),
    },
  ]

  if (props.role === 'mentor') {
    baseItems.push({
      label: () => h(RouterLink, { to: { name: 'my-mentee' } }, { default: () => 'Mentee Saya' }),
      key: 'my-mentee',
      icon: renderIcon(PeopleOutline),
    })
  } else {
    baseItems.push({
      label: () => h(RouterLink, { to: { name: 'my-mentor' } }, { default: () => 'Mentor Saya' }),
      key: 'my-mentor',
      icon: renderIcon(SchoolOutline),
    })
  }

  baseItems.push({
    label: () =>
      h(RouterLink, { to: { name: 'mentoring-sessions' } }, { default: () => 'Sesi Mentoring' }),
    key: 'mentoring-sessions',
    icon: renderIcon(PeopleOutline),
  })

  baseItems.push({
    label: () => h(RouterLink, { to: { name: 'profile' } }, { default: () => 'Profil' }),
    key: 'profile',
    icon: renderIcon(PersonCircleOutline),
  })

  return baseItems
})

const activeKey = computed(() => route.name)
const roleLabel = computed(() =>
  props.role ? props.role.charAt(0).toUpperCase() + props.role.slice(1) : '-',
)
const initials = computed(
  () =>
    props.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'U',
)
</script>

<template>
  <div class="relative flex h-full min-h-0 flex-col overflow-hidden p-3">
    <div class="min-h-0 flex-1 space-y-3 overflow-hidden pb-24">
      <div class="rounded-2xl border border-gray-100 bg-gradient-to-br from-[#f5faf7] to-white p-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--green-color) text-sm font-bold text-white shadow-sm"
            aria-hidden="true"
          >
            {{ initials }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-(--dark-color)">{{ name }}</p>
            <n-tag class="mt-1" type="success" size="small" round>{{ roleLabel }}</n-tag>
          </div>
        </div>
      </div>

      <p class="px-3 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        Navigasi
      </p>
      <n-menu
        class="sidebar-menu"
        :value="activeKey"
        :options="menuOptions"
        aria-label="Navigasi utama"
      />
    </div>

    <div class="absolute inset-x-3 bottom-3 z-30 border-t border-gray-100 bg-white px-2 pt-3">
      <n-button
        class="!min-h-11 !rounded-xl"
        block
        type="error"
        ghost
        aria-label="Keluar dari akun"
        @click="$emit('logout')"
      >
        <template #icon>
          <n-icon>
            <exit-outline />
          </n-icon>
        </template>
        Keluar
      </n-button>
    </div>
  </div>
</template>
