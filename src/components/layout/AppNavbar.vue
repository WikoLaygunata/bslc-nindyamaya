<script setup>
import { MenuOutline } from '@vicons/ionicons5'
import { NButton, NIcon } from 'naive-ui'
import logoUrl from '@/assets/small-logo.png'

defineEmits(['toggle-sidebar'])
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-[72px] w-full items-center justify-between gap-4 border-b border-gray-200/80 bg-white/95 px-4 backdrop-blur-md md:px-8"
  >
    <div class="flex items-center gap-2.5">
      <div class="lg:hidden">
        <n-button
          aria-label="Buka menu navigasi"
          class="!rounded-xl"
          quaternary
          @click="$emit('toggle-sidebar')"
        >
          <template #icon>
            <n-icon>
              <menu-outline />
            </n-icon>
          </template>
        </n-button>
      </div>
      <img :src="logoUrl" alt="Logo Nindyamaya" class="h-[34px] w-[34px]" />
      <span class="text-base font-bold tracking-[0.5px] text-(--green-color) sm:text-lg">
        NINDYAMAYA
      </span>
    </div>
    <div class="hidden text-right text-xs font-medium text-(--grey-color) md:block">
      OLEH
      <span class="text-base font-bold text-(--green-color)">BINUS</span>
      <span class="text-(--grey-color)"> Student Learning Community</span>
    </div>
  </header>
</template>
