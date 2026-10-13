<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f8f7] p-6"
  >
    <div
      class="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-100 blur-3xl"
    ></div>
    <div
      class="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-lime-100 blur-3xl"
    ></div>
    <main
      class="relative w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl shadow-emerald-950/5 ring-1 ring-gray-100 sm:p-12"
    >
      <div
        class="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-(--green-color)"
      >
        <span class="text-3xl font-bold">404</span>
      </div>
      <p class="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-(--green-color)">
        Halaman tidak ditemukan
      </p>
      <h1 class="mt-2 text-2xl font-bold tracking-tight text-(--dark-color)">
        Halaman ini tidak tersedia
      </h1>
      <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
        Halaman mungkin telah dipindahkan atau tautannya salah. Mari kembali ke halaman utama.
      </p>
      <n-button class="!mt-7 !rounded-xl" type="primary" size="large" @click="router.push('/')">
        Kembali ke beranda
      </n-button>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
const router = useRouter()
</script>
