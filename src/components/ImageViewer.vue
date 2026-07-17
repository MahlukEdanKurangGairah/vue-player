<template>
  <div v-if="images.length > 0" class="image-viewer" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #000;">
    <img
      :src="images[currentIndex]?.src"
      :alt="images[currentIndex]?.name"
      style="max-width: 100%; max-height: 100vh; object-fit: contain; user-select: none;"
      draggable="false"
    />
    <div
      v-if="controlsVisible"
      class="position-absolute start-0 end-0 px-3 d-flex align-items-center"
      style="top: 0; height: 64px; z-index: 10; background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%); pointer-events: auto;"
      @mouseenter="$emit('resetHideTimer')"
      @mouseleave="$emit('startHideTimer')"
    >
      <button class="btn btn-icon text-white me-2" title="Back" @click="$emit('back')">
        <IconArrowLeft />
      </button>
      <span class="text-white small fw-medium text-truncate flex-grow-1">
        {{ images[currentIndex]?.name }}
      </span>
      <span class="text-white-50 small me-3">{{ currentIndex + 1 }} / {{ images.length }}</span>
      <div class="btn-list">
        <button class="btn btn-icon text-white" title="Previous" :disabled="currentIndex <= 0" @click="$emit('prev')">
          <IconChevronLeft />
        </button>
        <button class="btn btn-icon text-white" title="Next" :disabled="currentIndex >= images.length - 1" @click="$emit('next')">
          <IconChevronRight />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconArrowLeft, IconChevronLeft, IconChevronRight } from '@tabler/icons-vue';

defineProps({
  images: { type: Array, default: () => [] },
  currentIndex: { type: Number, default: -1 },
  controlsVisible: Boolean
});

defineEmits(['back', 'prev', 'next', 'resetHideTimer', 'startHideTimer']);
</script>
