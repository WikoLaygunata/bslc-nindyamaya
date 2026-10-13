<script setup>
import { reactive, ref } from 'vue'
import { LockClosedOutline, MailOutline } from '@vicons/ionicons5'
import { NButton, NCard, NForm, NFormItem, NIcon, NInput, NTag, NText, useMessage } from 'naive-ui'
import { login } from '@/api/api'
import { useAuthStore } from '@/stores/auth'
import logoUrl from '@/assets/BSLC-logo.png'

const message = useMessage()
const auth = useAuthStore()
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
})

async function handleSubmit() {
  if (!form.email || !form.password) {
    message.warning('Silakan isi email dan kata sandi.')
    return
  }

  try {
    loading.value = true
    const response = await login(form)
    auth.setAuth(response.token, response.user)
    message.success(`Selamat datang, ${response.user.name}`)
    const homeUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
    window.location.replace(homeUrl.href)
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main
    class="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-[#f4f6e8] via-[#f8faf7] to-[#e8f1ed] p-4 sm:p-6"
  >
    <div
      class="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-(--green-color)/15 blur-3xl"
    ></div>
    <div
      class="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-600/10 blur-3xl"
    ></div>
    <div class="relative mx-auto flex w-full max-w-5xl items-center justify-center">
      <n-card
        :bordered="false"
        class="w-full overflow-hidden !rounded-3xl shadow-2xl shadow-emerald-950/10 ring-1 ring-white/70"
      >
        <div class="grid md:grid-cols-[1.05fr_1fr]">
          <section
            class="relative isolate hidden overflow-hidden bg-gradient-to-br from-[#095754] via-[#0b6862] to-[#063f3d] p-9 text-(--white-color) md:flex md:min-h-[530px] md:flex-col md:justify-between lg:p-11"
          >
            <div
              class="pointer-events-none absolute -right-20 top-24 -z-10 h-72 w-72 rounded-full border-[45px] border-white/5"
            ></div>
            <div
              class="pointer-events-none absolute -bottom-20 -right-10 -z-10 h-64 w-64 rounded-full bg-emerald-300/10 blur-2xl"
            ></div>
            <div class="space-y-5">
              <img
                :src="logoUrl"
                alt="NINDYAMAYA Logo"
                class="h-14 w-14 rounded-2xl bg-white p-1.5 shadow-lg"
              />
              <n-tag class="!border-white/20 !bg-white/10 !text-white" size="small" round>
                BSLC Mentoring
              </n-tag>
              <h1 class="max-w-sm text-4xl font-bold leading-tight tracking-tight">
                Bertumbuh bersama, satu sesi demi satu sesi.
              </h1>
              <p class="max-w-sm text-sm/6 text-white/80">
                Ruang untuk terhubung dengan mentor, memantau sesi, dan memaksimalkan setiap momen
                belajar.
              </p>
            </div>
            <p class="text-xs text-white/70">
              BY
              <a
                href="https://bslc.or.id"
                target="_blank"
                rel="noreferrer"
                class="font-bold text-base"
                >BINUS STUDENT LEARNING COMMUNITY</a
              >
            </p>
          </section>

          <section class="flex flex-col justify-center p-6 sm:p-9 md:p-10 lg:p-12">
            <div class="mb-8 text-center md:text-left">
              <div class="mb-5 flex justify-center md:hidden">
                <img
                  :src="logoUrl"
                  alt="NINDYAMAYA Logo"
                  class="h-14 w-14 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm"
                />
              </div>
              <p
                class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--green-color)"
              >
                NINDYAMAYA
              </p>
              <h2 class="text-2xl font-bold tracking-tight text-(--dark-color) sm:text-3xl">
                Selamat datang kembali
              </h2>
              <n-text depth="3">Masuk untuk melanjutkan ke dashboard.</n-text>
            </div>

            <n-form class="space-y-2" @submit.prevent="handleSubmit">
              <n-form-item label="Email">
                <n-input
                  v-model:value="form.email"
                  type="email"
                  placeholder="nama@email.com"
                  aria-label="Alamat email"
                  size="large"
                  autocomplete="username"
                >
                  <template #prefix>
                    <n-icon><mail-outline /></n-icon>
                  </template>
                </n-input>
              </n-form-item>
              <n-form-item label="Kata sandi">
                <n-input
                  v-model:value="form.password"
                  type="password"
                  show-password-on="click"
                  placeholder="Masukkan kata sandi"
                  aria-label="Kata sandi"
                  size="large"
                  autocomplete="current-password"
                >
                  <template #prefix>
                    <n-icon><lock-closed-outline /></n-icon>
                  </template>
                </n-input>
              </n-form-item>
              <n-button
                type="primary"
                block
                size="large"
                :loading="loading"
                attr-type="submit"
                class="mt-4! h-12! rounded-xl! font-semibold! shadow-md shadow-emerald-900/15 transition-transform hover:-translate-y-0.5"
              >
                Masuk
              </n-button>
            </n-form>
            <p class="mt-8 text-center text-xs text-gray-400 md:text-left">
              BINUS Student Learning Community
            </p>
          </section>
        </div>
      </n-card>
    </div>
  </main>
</template>
