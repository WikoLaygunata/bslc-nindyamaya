<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <h1 class="text-4xl font-bold">404</h1>
    <p class="text-2xl mb-3">Page not found</p>
    <n-button
      style="padding-left: 30px; padding-right: 30px"
      type="primary"
      @click="router.push('/')"
      >Go Back</n-button
    >
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
const router = useRouter()
</script>
