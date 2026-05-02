<script setup>
import { computed, ref } from 'vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'

const isMobileSidebarOpen = ref(false)
const auth = useAuthStore()

const role = computed(() => auth.role.value)
const userName = computed(() => auth.user.value?.name ?? 'User')

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
</script>

<template>
  <div class="min-h-screen bg-(--white-color)">
    <app-navbar @toggle-sidebar="handleToggleMobileSidebar" />

    <div class="relative flex min-h-[calc(100vh-72px)]">
      <aside class="hidden w-[260px] border-r border-gray-200 bg-white lg:block">
        <app-sidebar :role="role" :name="userName" @logout="handleLogout" />
      </aside>

      <div
        class="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-out lg:hidden"
        :class="isMobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'"
        @click="closeMobileSidebar"
      />
      <aside
        class="fixed left-0 top-0 z-50 h-screen w-[260px] border-r border-gray-200 bg-white transition-transform duration-300 ease-out lg:hidden"
        :class="isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <app-sidebar :role="role" :name="userName" @logout="handleLogout" />
      </aside>

      <main class="min-w-0 flex-1 p-4 md:p-5">
        <router-view />
      </main>
    </div>
  </div>
</template>
