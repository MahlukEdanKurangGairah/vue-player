<template>
  <div class="photo-grid-view" style="position: absolute; inset: 0; overflow: auto; background: #0a0a0f;">
    <div class="d-flex align-items-center gap-2 px-3 py-3 position-sticky top-0" style="background: #0a0a0f; z-index: 5; border-bottom: 1px solid rgba(255,255,255,0.06);">
      <button class="btn btn-icon text-white" title="Back" @click="$emit('back')">
        <IconArrowLeft />
      </button>
      <span class="text-white fw-medium">Photos ({{ images.length }})</span>
      <div class="flex-grow-1"></div>
      <button class="btn btn-icon btn-sm text-white-50" title="Thumbnail Size">
        <IconPhoto />
      </button>
    </div>
    <div class="photo-grid p-3" ref="gridRef">
      <div v-for="(img, i) in images" :key="i" class="photo-item" @click="$emit('select', i)">
        <img :data-src="img.src" :alt="img.name" class="lozad" />
        <div class="photo-name">{{ img.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import lozad from 'lozad';
import { IconArrowLeft, IconPhoto } from '@tabler/icons-vue';

const props = defineProps({
  images: { type: Array, default: () => [] }
});

defineEmits(['back', 'select']);

const gridRef = ref(null);
let observer = null;

function initLozad() {
  if (observer) observer.observer.disconnect();
  observer = lozad('.lozad', {
    rootMargin: '200px 0px',
    loaded(el) { el.style.opacity = '1'; }
  });
  observer.observe();
}

onMounted(() => initLozad());

watch(() => props.images.length, () => {
  setTimeout(() => initLozad(), 0);
});
</script>
