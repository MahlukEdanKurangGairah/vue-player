<template>
  <div class="player-view" style="position: absolute; inset: 0;">
    <div class="d-flex justify-content-center align-items-center" style="width:100vw; height: 100vh;">
      <video
        ref="videoElRef"
        style="height: 100%; object-fit: contain; position: relative; z-index: 0;"
        @timeupdate="(e) => $emit('timeupdate', e)"
        @ended="$emit('ended')"
        @loadedmetadata="(e) => $emit('videoloaded', e)"
        @error="$emit('error')"
      ></video>
    </div>

    <div
      v-if="!isVideo && currentTrack"
      class="position-absolute d-flex flex-column align-items-center justify-content-center gap-3"
      style="inset: 0; background: radial-gradient(ellipse at center, rgba(10,10,15,0.92), rgba(0,0,0,0.98)); z-index: 2;"
    >
      <div class="card bg-dark border-0" style="width: 220px; height: 220px; border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
        <div class="card-body d-flex flex-column align-items-center justify-content-center gap-3">
          <IconDiscFilled :class="isPlaying ? 'text-primary' : 'text-secondary'" size="64" />
          <div class="d-flex align-items-end gap-1" style="height: 24px;">
            <div v-for="i in 16" :key="i" class="vis-bar" :class="{ playing: isPlaying }"
              :style="{ animationDelay: `${(i * 67) % 600}ms` }" />
          </div>
        </div>
      </div>
      <div class="text-center px-4" style="max-width: 400px;">
        <div class="text-white fw-bold fs-5 text-truncate">{{ currentTrack.name }}</div>
        <div class="text-muted small mt-1">Audio</div>
      </div>
    </div>

    <div
      v-if="!currentTrack"
      class="position-absolute d-flex flex-column align-items-center justify-content-center gap-3"
      style="inset: 0; z-index: 1; pointer-events: none;"
    >
      <IconPlayerPlayFilled size="96" class="text-secondary" style="opacity: 0.3;" />
      <div class="text-muted fs-4 fw-medium">AdjadTea-Player</div>
      <div class="text-muted small" style="opacity: 0.5;">Drop media files or File → Open</div>
    </div>

    <div
      v-if="controlsVisible"
      class="controls-overlay position-absolute bottom-0 start-0 end-0 px-3 pb-3 pt-2 d-flex flex-column justify-content-end"
      style="height: 15%; z-index: 10; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 100%); pointer-events: auto;"
      @mouseenter="$emit('resetHideTimer')"
      @mouseleave="$emit('startHideTimer')"
    >
      <div v-if="currentTrack" class="d-flex align-items-center gap-2 mb-2">
        <component :is="isVideo ? IconMovie : IconMusic" class="text-primary" />
        <span class="text-white small fw-medium text-truncate">{{ currentTrack.name }}</span>
      </div>

      <div class="d-flex align-items-center gap-2 mb-1" style="cursor: pointer;"
        @click="(e) => $emit('seek', e)" @mousedown="(e) => $emit('progressMouseDown', e)">
        <span class="text-white-50 small fw-medium" style="min-width: 40px; text-align: right;">{{ formatTime(currentTime) }}</span>
        <div class="progress flex-grow-1 vlc-progress" style="height: 4px; --tblr-progress-height: 4px;" ref="progressElRef">
          <div class="progress-bar" :style="{ width: progressPercent + '%' }" style="background: #39ff14;"></div>
        </div>
        <span class="text-white-50 small fw-medium" style="min-width: 40px;">{{ formatTime(duration) }}</span>
      </div>

      <div class="d-flex align-items-center" style="min-height: 40px;">
        <div class="btn-list">
          <button class="btn btn-icon text-white" data-bs-toggle="tooltip" data-bs-placement="top" title="Previous" @click="$emit('prev')">
            <IconPlayerSkipBackFilled />
          </button>
          <button class="btn btn-icon text-white" :title="isPlaying ? 'Pause' : 'Play'" @click="$emit('togglePlay')">
            <component :is="isPlaying ? IconPlayerPauseFilled : IconPlayerPlayFilled" size="28" />
          </button>
          <button class="btn btn-icon text-white" data-bs-toggle="tooltip" data-bs-placement="top" title="Next" @click="$emit('next')">
            <IconPlayerSkipForwardFilled />
          </button>
          <button class="btn btn-icon text-white" data-bs-toggle="tooltip" data-bs-placement="top" title="Stop" @click="$emit('stop')">
            <IconPlayerStopFilled size="18" />
          </button>
        </div>

        <div class="flex-grow-1"></div>

        <div class="btn-list">
          <button class="btn btn-icon btn-sm" :class="isShuffle ? 'text-primary' : 'text-white'"
            data-bs-toggle="tooltip" data-bs-placement="top" title="Shuffle" @click="$emit('toggleShuffle')">
            <IconArrowsShuffle />
          </button>
          <button class="btn btn-icon btn-sm" :class="repeatMode > 0 ? 'text-primary' : 'text-white'"
            data-bs-toggle="tooltip" data-bs-placement="top" :title="repeatTooltip" @click="$emit('toggleRepeat')">
            <component :is="repeatMode === 2 ? IconRepeatOnce : IconRepeat" />
          </button>
        </div>

        <div class="flex-grow-1"></div>

        <div class="btn-list d-flex align-items-center">
          <button class="btn btn-icon btn-sm text-white fw-bold small" @click="$emit('cycleSpeed')" style="min-width: 36px; font-size: 11px;">
            {{ currentSpeed }}×
          </button>
          <button class="btn btn-icon btn-sm text-white" data-bs-toggle="tooltip" data-bs-placement="top"
            :title="volume === 0 ? 'Unmute' : 'Mute'" @click="$emit('toggleMute')">
            <component :is="volumeIcon" />
          </button>
          <input type="range" class="form-range" style="width: 70px; --tblr-form-range-track-bg: rgba(255,255,255,0.2);"
            :value="volume" :min="0" :max="100" :step="1"
            @input="$emit('setVolume', Number($event.target.value))" />
          <button v-if="isVideo" class="btn btn-icon btn-sm text-white" data-bs-toggle="tooltip" data-bs-placement="top"
            title="Picture in Picture" @click="$emit('togglePiP')">
            <IconPictureInPicture />
          </button>
          <button class="btn btn-icon btn-sm text-white" data-bs-toggle="tooltip" data-bs-placement="top"
            title="Fullscreen" @click="$emit('toggleFullscreen')">
            <IconArrowsMaximize />
          </button>
          <button class="btn btn-icon btn-sm text-white" data-bs-toggle="tooltip" data-bs-placement="top"
            title="Playlist" @click="$emit('openPlaylist')">
            <IconPlaylist />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  IconPlayerPlayFilled, IconPlayerPauseFilled,
  IconPlayerSkipBackFilled, IconPlayerSkipForwardFilled, IconPlayerStopFilled,
  IconArrowsShuffle, IconRepeat, IconRepeatOnce,
  IconVolume, IconVolumeOff,
  IconArrowsMaximize, IconPictureInPicture,
  IconPlaylist,
  IconMovie, IconMusic, IconDiscFilled
} from '@tabler/icons-vue';

const props = defineProps({
  currentTrack: Object,
  isVideo: Boolean,
  isPlaying: Boolean,
  isShuffle: Boolean,
  repeatMode: Number,
  currentSpeed: Number,
  currentTime: Number,
  duration: Number,
  progressPercent: Number,
  volume: Number,
  controlsVisible: Boolean
});

const emit = defineEmits([
  'timeupdate', 'ended', 'videoloaded', 'error',
  'seek', 'progressMouseDown',
  'prev', 'togglePlay', 'next', 'stop',
  'toggleShuffle', 'toggleRepeat', 'cycleSpeed',
  'toggleMute', 'setVolume', 'togglePiP',
  'toggleFullscreen', 'openPlaylist',
  'resetHideTimer', 'startHideTimer'
]);

const videoElRef = ref(null);
const progressElRef = ref(null);

defineExpose({ videoEl: videoElRef, progressEl: progressElRef });

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const volumeIcon = computed(() => props.volume === 0 ? IconVolumeOff : IconVolume);

const repeatTooltip = computed(() => {
  if (props.repeatMode === 0) return 'Repeat: Off';
  if (props.repeatMode === 1) return 'Repeat: All';
  return 'Repeat: One';
});
</script>
