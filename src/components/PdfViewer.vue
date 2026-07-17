<template>
  <div class="pdf-viewer" style="position: absolute; inset: 0; display: flex; flex-direction: column; background: #1a1a1f;">
    <div
      v-if="controlsVisible"
      class="d-flex align-items-center gap-3 px-3 py-2 w-100"
      style="background: rgba(0,0,0,0.85); z-index: 5; min-height: 48px;"
      @mouseenter="$emit('resetHideTimer')"
      @mouseleave="$emit('startHideTimer')"
    >
      <button class="btn btn-icon btn-sm text-white" title="Back" @click="$emit('back')">
        <IconArrowLeft />
      </button>
      <span class="text-white small fw-medium text-truncate flex-grow-1">{{ fileName }}</span>
    </div>
    <embed
      :src="'file://' + filePath"
      type="application/pdf"
      style="flex: 1; width: 100%; border: none;"
    />
  </div>
</template>

<script setup>
import { IconArrowLeft } from '@tabler/icons-vue';

defineProps({
  filePath: String,
  fileName: String,
  controlsVisible: Boolean
});

defineEmits(['back', 'resetHideTimer', 'startHideTimer']);
</script>
