<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'

const isMobileSidebarOpen = ref(false)
const auth = useAuthStore()

const role = computed(() => auth.role.value)
const userName = computed(() => auth.user.value?.name ?? 'Pengguna')

function handleToggleMobileSidebar() {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

function handleLogout() {
  auth.clearAuth()
  const loginUrl = new URL('login', new URL(import.meta.env.BASE_URL, window.location.origin))
  window.location.replace(loginUrl.href)
}

window.addEventListener('auth:unauthorized', handleLogout)
onBeforeUnmount(() => {
  window.removeEventListener('auth:unauthorized', handleLogout)
})
</script>

<template>
  <div class="flex h-[100dvh] flex-col overflow-hidden bg-[#f6f8f7]">
    <app-navbar class="shrink-0" @toggle-sidebar="handleToggleMobileSidebar" />

    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="hidden h-full min-h-0 w-[260px] shrink-0 overflow-hidden border-r border-gray-200/80 bg-white lg:block"
      >
        <app-sidebar :role="role" :name="userName" @logout="handleLogout" />
      </aside>

      <div
        class="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-out lg:hidden"
        :class="
          isMobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        "
        @click="closeMobileSidebar"
      />
      <aside
        class="fixed left-0 top-0 z-50 h-[100dvh] w-[280px] overflow-hidden border-r border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden"
        :class="isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <app-sidebar :role="role" :name="userName" @logout="handleLogout" />
      </aside>

      <main class="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6 xl:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
