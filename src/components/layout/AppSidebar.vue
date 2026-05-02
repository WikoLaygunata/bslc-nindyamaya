<script setup>
import { computed, h } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ExitOutline, HomeOutline, PeopleOutline, SchoolOutline } from '@vicons/ionicons5'
import { NButton, NIcon, NMenu, NTag } from 'naive-ui'

const props = defineProps({
  role: {
    type: String,
    default: 'mentee',
  },
  name: {
    type: String,
    default: 'User',
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
      label: () => h(RouterLink, { to: { name: 'home' } }, { default: () => 'Home' }),
      key: 'home',
      icon: renderIcon(HomeOutline),
    },
  ]

  if (props.role === 'mentor') {
    baseItems.push({
      label: () => h(RouterLink, { to: { name: 'my-mentee' } }, { default: () => 'My Mentee' }),
      key: 'my-mentee',
      icon: renderIcon(PeopleOutline),
    })
  } else {
    baseItems.push({
      label: () => h(RouterLink, { to: { name: 'my-mentor' } }, { default: () => 'My Mentor' }),
      key: 'my-mentor',
      icon: renderIcon(SchoolOutline),
    })
  }

  baseItems.push({
    label: () =>
      h(
        RouterLink,
        { to: { name: 'mentoring-sessions' } },
        { default: () => 'Mentoring Sessions' },
      ),
    key: 'mentoring-sessions',
    icon: renderIcon(PeopleOutline),
  })

  return baseItems
})

const activeKey = computed(() => route.name)
const roleLabel = computed(() =>
  props.role ? props.role.charAt(0).toUpperCase() + props.role.slice(1) : '-',
)
</script>

<template>
  <div class="h-full min-h-[calc(100vh-72px)] p-3">
    <div class="space-y-3 pb-24">
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div class="mb-3">
          <n-tag type="success" size="small" round>{{ roleLabel }}</n-tag>
        </div>
        <p class="truncate text-base font-semibold text-(--dark-color)">{{ name }}</p>
      </div>

      <n-menu :value="activeKey" :options="menuOptions" />
    </div>

    <div class="fixed bottom-3 left-3 z-30 w-[236px] p-2">
      <n-button block type="error" ghost @click="$emit('logout')">
        <template #icon>
          <n-icon>
            <exit-outline />
          </n-icon>
        </template>
        Logout
      </n-button>
    </div>
  </div>
</template>
