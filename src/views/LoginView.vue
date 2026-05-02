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
    message.warning('Please fill email and password')
    return
  }

  try {
    loading.value = true
    const response = await login(form)
    auth.setAuth(response.token, response.user)
    message.success(`Welcome, ${response.user.name}`)
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
  <main class="relative h-screen overflow-hidden bg-(--cream-color) p-4 md:p-6">
    <div
      class="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-(--green-color)/20 blur-3xl"
    ></div>
    <div
      class="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-(--green-color)/20 blur-3xl"
    ></div>
    <div class="relative mx-auto flex h-full w-full max-w-5xl items-center justify-center">
      <n-card :bordered="false" class="w-full overflow-hidden rounded-3xl shadow-2xl">
        <div class="grid md:grid-cols-[1.1fr_1fr]">
          <section
            class="hidden bg-linear-to-br from-(--green-color) to-emerald-700 p-8 text-(--white-color) md:flex md:flex-col md:justify-between"
          >
            <div class="space-y-4">
              <img
                :src="logoUrl"
                alt="NINDYAMAYA Logo"
                class="h-14 w-14 rounded-lg bg-white p-1.5"
              />
              <n-tag type="success" size="small" round>BSLC Mentoring</n-tag>
              <h1 class="text-3xl font-bold leading-tight">NINDYAMAYA Dashboard</h1>
              <p class="max-w-sm text-sm/6 text-white/80">
                A single portal for mentors and mentees to manage mentoring activities.
              </p>
            </div>
            <p class="text-xs text-white/70">
              BY
              <a href="https://bslc.or.id" target="_blank" class="font-bold text-base"
                >BINUS STUDENT LEARNING COMMUNITY</a
              >
            </p>
          </section>

          <section class="p-6 sm:p-8 md:p-10">
            <div class="mb-6 text-center md:text-left">
              <div class="mb-3 flex justify-center md:hidden">
                <img
                  :src="logoUrl"
                  alt="NINDYAMAYA Logo"
                  class="h-14 w-14 rounded-lg border border-gray-200 p-1.5"
                />
              </div>
              <h2 class="text-2xl font-bold text-(--dark-color)">Welcome Back</h2>
              <n-text depth="3">Sign in to continue to your dashboard</n-text>
            </div>

            <n-form @submit.prevent="handleSubmit" class="space-y-2">
              <n-form-item label="Email">
                <n-input
                  v-model:value="form.email"
                  type="text"
                  placeholder="Input your email"
                  size="large"
                >
                  <template #prefix>
                    <n-icon><mail-outline /></n-icon>
                  </template>
                </n-input>
              </n-form-item>
              <n-form-item label="Password">
                <n-input
                  v-model:value="form.password"
                  type="password"
                  show-password-on="click"
                  placeholder="Input your password"
                  size="large"
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
                class="mt-4! h-11! rounded-xl! font-semibold!"
              >
                Login
              </n-button>
            </n-form>
          </section>
        </div>
      </n-card>
    </div>
  </main>
</template>
