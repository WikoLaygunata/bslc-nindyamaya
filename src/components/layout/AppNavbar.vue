<script setup>
import { MenuOutline } from '@vicons/ionicons5'
import { NButton, NIcon } from 'naive-ui'
import logoUrl from '@/assets/small-logo.png'

defineEmits(['toggle-sidebar'])
</script>

<template>
  <header
    class="flex h-[72px] w-full items-center justify-between gap-4 border-b border-gray-200 bg-white px-8"
  >
    <div class="flex items-center gap-2.5">
      <div class="lg:hidden">
        <n-button style="padding-left: 0" quaternary @click="$emit('toggle-sidebar')">
          <template #icon>
            <n-icon>
              <menu-outline />
            </n-icon>
          </template>
        </n-button>
      </div>
      <img :src="logoUrl" alt="NINDYAMAYA Logo" class="h-[34px] w-[34px]" />
      <span class="text-lg font-bold tracking-[0.5px] text-(--green-color)">NINDYAMAYA</span>
    </div>
    <div class="hidden text-right text-(--grey-color) text-xs font-medium md:block">
      BY
      <span class="font-bold text-base text-(--green-color)">BINUS</span>
      <span class="text-base text-(--grey-color)"> Student Learning Community</span>
    </div>
  </header>
</template>
