<script setup>
import { computed } from 'vue'
import { NCard, NTag } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const user = computed(() => auth.user.value)
</script>

<template>
  <n-card title="Home">
    <p>Welcome back, <strong>{{ user?.name || '-' }}</strong>.</p>
    <p>Your role: <n-tag type="success">{{ user?.role || '-' }}</n-tag></p>
    <p>This is the dashboard home page.</p>
  </n-card>
</template>
