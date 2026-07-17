<template>
	<div class="app" :data-bs-theme="currentTheme" style="height: 100vh; display: flex; flex-direction: column; background: #000;">
	<!-- ==================== PLAYLIST OFFCANVAS (right side) ==================== -->
	<div class="offcanvas offcanvas-end" tabindex="-1" id="playlistOffcanvas" ref="playlistOffcanvas" style="width: 320px !important;">
		<div class="offcanvas-header">
		<h5 class="offcanvas-title d-flex align-items-center gap-2">
			<IconPlaylist class="text-primary" />
			<span>Queue ({{ playlist.length }})</span>
		</h5>
		<div class="d-flex gap-1 ms-auto me-2">
			<button class="btn btn-icon btn-sm" title="Add Files" @click="openFiles"><IconFilePlus /></button>
			<button class="btn btn-icon btn-sm" title="Add Folder" @click="openFolder"><IconFolderPlus /></button>
			<button class="btn btn-icon btn-sm" title="Clear" :disabled="playlist.length === 0" @click="clearPlaylist"><IconPlaylistX /></button>
		</div>
		<button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
		</div>
		<div class="offcanvas-body d-flex flex-column p-0">
		<div class="list-group list-group-flush flex-grow-1 overflow-auto" style="flex: 1; min-height: 0;">
			<a v-for="(item, i) in playlist"
				:key="item.path"
				class="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2 px-3"
				:class="{ active: i === currentIndex }"
				href="#"
				@click.prevent="playIndex(i)"
			>
				<span class="text-muted small" style="min-width: 24px; text-align: center;">
					{{ i === currentIndex ? '▶' : (i + 1) }}
				</span>
				<div class="flex-grow-1 text-truncate">
					<div class="text-truncate small">{{ item.name }}</div>
					<small class="text-muted">{{ item.type === 'video' ? '🎬 Video' : '🎵 Audio' }}</small>
				</div>
				<button class="btn btn-icon btn-sm text-muted remove-btn" @click.stop="removeFromPlaylist(i)">
					<IconX />
				</button>
			</a>
			<div v-if="playlist.length === 0" class="text-center text-muted py-4 small">
			Queue is empty
			</div>
		</div>

			<hr class="my-0">

			<div class="d-flex align-items-center justify-content-between px-3 py-2">
				<small class="text-muted fw-bold text-uppercase">History ({{ playedHistory.length }})</small>
				<button class="btn btn-icon btn-sm" :disabled="playedHistory.length === 0" @click="playedHistory = []">
				<IconTrash />
				</button>
			</div>

			<div class="list-group list-group-flush overflow-auto" style="flex: 1; min-height: 0;">
				<a
				v-for="(item, i) in playedHistory"
				:key="`h-${item.path}-${i}`"
				class="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2 px-3"
				href="#"
				@click.prevent="playHistoryItem(item)"
				>
				<component :is="isVideoFile(item.path) ? IconMovie : IconMusic" class="text-muted" />
				<div class="flex-grow-1 text-truncate">
					<div class="text-truncate small">{{ item.name }}</div>
				</div>
				<small class="text-muted">{{ item.playedAt }}</small>
				</a>
				<div v-if="playedHistory.length === 0" class="text-center text-muted py-4 small">
				No played files yet
				</div>
			</div>
		</div>
	</div>

	<!-- ==================== MAIN CONTENT AREA ==================== -->
	<div
		class="video-area flex-grow-1 position-relative bg-black"
		@mousemove="wakeControls"
		@mouseleave="startHideTimer"
	>
		<PlayerView
			ref="playerViewRef"
			v-show="currentView === 'player'"
			:currentTrack="currentTrack"
			:isVideo="isVideo"
			:isPlaying="isPlaying"
			:isShuffle="isShuffle"
			:repeatMode="repeatMode"
			:currentSpeed="currentSpeed"
			:currentTime="currentTime"
			:duration="duration"
			:progressPercent="progressPercent"
			:volume="volume"
			:controlsVisible="controlsVisible"
			@timeupdate="onTimeUpdate"
			@ended="onMediaEnded"
			@videoloaded="onVideoLoaded"
			@error="onMediaError"
			@seek="seekProgress"
			@progressMouseDown="onProgressMouseDown"
			@prev="prevTrack"
			@togglePlay="togglePlay"
			@next="nextTrack"
			@stop="stopMedia"
			@toggleShuffle="toggleShuffle"
			@toggleRepeat="toggleRepeat"
			@cycleSpeed="cycleSpeed"
			@toggleMute="toggleMute"
			@setVolume="setVolume"
			@togglePiP="togglePiP"
			@toggleFullscreen="toggleFullscreen"
			@openPlaylist="openPlaylist"
			@resetHideTimer="resetHideTimer"
			@startHideTimer="startHideTimer"
		/>

		<ImageViewer
			v-show="currentView === 'image'"
			:images="imageGallery"
			:currentIndex="currentImageIndex"
			:controlsVisible="controlsVisible"
			@back="backToPlayer"
			@prev="prevImage"
			@next="nextImage"
			@resetHideTimer="resetHideTimer"
			@startHideTimer="startHideTimer"
		/>

		<PhotoGrid
			v-show="currentView === 'photogrid'"
			:images="imageGallery"
			@back="backToPlayer"
			@select="showImage"
		/>

		<PdfViewer
			v-show="currentView === 'pdf'"
			:filePath="pdfFilePath"
			:fileName="pdfFileName"
			:controlsVisible="controlsVisible"
			@back="backToPlayer"
			@resetHideTimer="resetHideTimer"
			@startHideTimer="startHideTimer"
		/>

		<!-- ============ DROP OVERLAY ============ -->
		<div
			v-if="dropActive"
			class="position-absolute d-flex align-items-center justify-content-center"
			style="inset: 0; z-index: 100; background: rgba(10,10,15,0.9);"
		>
			<div class="text-center d-flex flex-column align-items-center gap-3 p-5 rounded-4" style="border: 3px dashed rgba(124,58,237,0.5);">
			<IconFileMusic size="80" class="text-primary" />
			<div class="text-white fw-bold fs-4">Drop files here</div>
			<div class="text-muted small">Video, audio, images & PDF supported</div>
			</div>
		</div>

		<!-- Hidden Audio Element -->
		<audio
			ref="audioPlayer"
			style="display: none;"
			@timeupdate="onTimeUpdate"
			@ended="onMediaEnded"
			@loadedmetadata="onAudioLoaded"
			@error="onMediaError"
		></audio>

		<!-- Error Toast -->
		<div class="toast-container position-fixed bottom-0 end-0 p-3">
			<div class="toast align-items-center text-bg-danger border-0" ref="errorToast" role="alert">
			<div class="d-flex">
				<div class="toast-body">{{ snackbar.message }}</div>
				<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
			</div>
			</div>
		</div>
	</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { Toast, Offcanvas, Tooltip } from 'bootstrap';
import PlayerView from './components/PlayerView.vue';
import ImageViewer from './components/ImageViewer.vue';
import PhotoGrid from './components/PhotoGrid.vue';
import PdfViewer from './components/PdfViewer.vue';
import {
  IconPlayerPlayFilled,
  IconPlaylist, IconFilePlus, IconFolderPlus, IconPlaylistX,
  IconMovie, IconMusic,
  IconTrash, IconFileMusic, IconX
} from '@tabler/icons-vue';

// ==================== REFS ====================
const playerViewRef = ref(null);
const audioPlayer = ref(null);
const errorToast = ref(null);
const playlistOffcanvas = ref(null);

const videoPlayer = computed(() => playerViewRef.value?.videoEl ?? null);
const progressBar = computed(() => playerViewRef.value?.progressEl ?? null);

// ==================== STATE ====================
const playlist = ref([]);
const playedHistory = ref([]);
const currentIndex = ref(-1);
const isPlaying = ref(false);
const isShuffle = ref(false);
const isVideo = ref(false);
const repeatMode = ref(0);
const currentSpeed = ref(1);
const currentTime = ref(0);
const duration = ref(0);
const progressPercent = ref(0);
const volume = ref(80);
const previousVolume = ref(80);
const isDragging = ref(false);
const dropActive = ref(false);
const controlsVisible = ref(true);
const currentTheme = ref('dark');
const snackbar = ref({ show: false, message: '' });
const currentView = ref('player');
const imageGallery = ref([]);
const currentImageIndex = ref(-1);
const pdfFileName = ref('');
const pdfFilePath = ref('');

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const AUDIO_EXTS = ['mp3', 'flac', 'ogg', 'wav', 'aac', 'm4a', 'opus', 'wma'];
const VIDEO_EXTS = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'm4v', 'wmv'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
const PDF_EXT = 'pdf';

let dragCounter = 0;
let hideTimer = null;
let bsOffcanvas = null;
let bsToast = null;

const currentTrack = computed(() => {
  if (currentIndex.value >= 0 && currentIndex.value < playlist.value.length) {
    return playlist.value[currentIndex.value];
  }
  return null;
});

// ==================== AUTO-HIDE CONTROLS ====================
function wakeControls() {
  controlsVisible.value = true;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (!isDragging.value) controlsVisible.value = false;
  }, 2500);
}

function startHideTimer() {
  clearTimeout(hideTimer);
  if (!isDragging.value) {
    hideTimer = setTimeout(() => { controlsVisible.value = false; }, 2000);
  }
}

function resetHideTimer() {
  controlsVisible.value = true;
  clearTimeout(hideTimer);
}

// ==================== PLAYLIST OFFCANVAS ====================
function openPlaylist() {
  if (!bsOffcanvas && playlistOffcanvas.value) {
    bsOffcanvas = new Offcanvas(playlistOffcanvas.value);
  }
  if (bsOffcanvas) bsOffcanvas.show();
}

// ==================== TOAST ====================
function showError(msg) {
  snackbar.value.message = msg;
  nextTick(() => {
    if (!bsToast && errorToast.value) {
      bsToast = new Toast(errorToast.value, { delay: 4000 });
    }
    if (bsToast) bsToast.show();
  });
}

// ==================== HELPERS ====================
function getFileExtension(fp) { return fp.split('.').pop().toLowerCase(); }

function getFileName(fp) {
  const parts = fp.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1].replace(/\.[^/.]+$/, '');
}

function getFullFileName(fp) {
  const parts = fp.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1];
}

function isVideoFile(fp) { return VIDEO_EXTS.includes(getFileExtension(fp)); }
function isAudioFile(fp) { return AUDIO_EXTS.includes(getFileExtension(fp)); }
function isImageFile(fp) { return IMAGE_EXTS.includes(getFileExtension(fp)); }
function isPDFFile(fp) { return getFileExtension(fp) === PDF_EXT; }

function getActiveMedia() { return isVideo.value ? videoPlayer.value : audioPlayer.value; }

function getNowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// ==================== PLAYED HISTORY ====================
function addToHistory(track) {
  if (!track) return;
  playedHistory.value = playedHistory.value.filter(h => h.path !== track.path);
  playedHistory.value.unshift({ ...track, playedAt: getNowTime() });
  if (playedHistory.value.length > 50) playedHistory.value = playedHistory.value.slice(0, 50);
}

function playHistoryItem(item) {
  if (!playlist.value.find(p => p.path === item.path)) {
    playlist.value.push({ path: item.path, name: item.name, type: item.type });
    playIndex(playlist.value.length - 1);
  } else {
    playIndex(playlist.value.findIndex(p => p.path === item.path));
  }
}

// ==================== FILE HANDLING ====================
function backToPlayer() {
  currentView.value = 'player';
}

function handleFiles(filePaths) {
  const images = filePaths.filter(isImageFile);
  const pdfs = filePaths.filter(isPDFFile);
  const media = filePaths.filter(fp => isVideoFile(fp) || isAudioFile(fp));

  if (pdfs.length === 1 && images.length === 0 && media.length === 0) {
    currentView.value = 'pdf';
    pdfFilePath.value = pdfs[0];
    pdfFileName.value = getFullFileName(pdfs[0]);
    return;
  }

  if (images.length > 0 && media.length === 0) {
    imageGallery.value = images.map(fp => ({
      path: fp,
      name: getFullFileName(fp),
      src: `file://${fp}`
    }));
    if (images.length === 1) {
      currentImageIndex.value = 0;
      currentView.value = 'image';
    } else {
      currentView.value = 'photogrid';
    }
    return;
  }

  if (media.length > 0) {
    currentView.value = 'player';
    addToPlaylist(media);
  }

  if (images.length > 0) {
    const newImages = images.map(fp => ({
      path: fp,
      name: getFullFileName(fp),
      src: `file://${fp}`
    }));
    const existingPaths = new Set(imageGallery.value.map(i => i.path));
    newImages.forEach(img => {
      if (!existingPaths.has(img.path)) imageGallery.value.push(img);
    });
  }
}

function addToPlaylist(filePaths) {
  const newItems = filePaths.filter(fp => {
    const ext = getFileExtension(fp);
    return AUDIO_EXTS.includes(ext) || VIDEO_EXTS.includes(ext);
  });
  if (newItems.length === 0) return;
  newItems.forEach(fp => {
    if (!playlist.value.find(p => p.path === fp)) {
      playlist.value.push({ path: fp, name: getFileName(fp), type: isVideoFile(fp) ? 'video' : 'audio' });
    }
  });
  if (currentIndex.value === -1 && playlist.value.length > 0) playIndex(0);
}

function removeFromPlaylist(index) {
  if (index === currentIndex.value) { stopMedia(); currentIndex.value = -1; }
  else if (index < currentIndex.value) currentIndex.value--;
  playlist.value.splice(index, 1);
  if (playlist.value.length === 0) resetPlayerState();
}

function clearPlaylist() { stopMedia(); playlist.value = []; currentIndex.value = -1; resetPlayerState(); }

function resetPlayerState() {
  isVideo.value = false; currentTime.value = 0; duration.value = 0; progressPercent.value = 0;
}

// ==================== IMAGE VIEWER ====================
function showImage(index) {
  currentImageIndex.value = index;
  currentView.value = 'image';
}

function prevImage() {
  if (currentImageIndex.value > 0) currentImageIndex.value--;
}

function nextImage() {
  if (currentImageIndex.value < imageGallery.value.length - 1) currentImageIndex.value++;
}

// ==================== MEDIA CONTROL ====================
function playIndex(index) {
  if (index < 0 || index >= playlist.value.length) return;
  const item = playlist.value[index];
  isVideo.value = item.type === 'video';
  currentIndex.value = index;
  stopCurrentMedia();
  getActiveMedia().src = `file://${item.path}`;
  getActiveMedia().load();
}

function stopCurrentMedia() {
  if (videoPlayer.value) { videoPlayer.value.pause(); videoPlayer.value.removeAttribute('src'); }
  if (audioPlayer.value) { audioPlayer.value.pause(); audioPlayer.value.removeAttribute('src'); }
}

function onVideoLoaded() { const v = videoPlayer.value; if (v && isFinite(v.duration)) { duration.value = v.duration; startPlayback(v); } }
function onAudioLoaded() { const a = audioPlayer.value; if (a && isFinite(a.duration)) { duration.value = a.duration; startPlayback(a); } }

function startPlayback(media) {
  media.play().then(() => { isPlaying.value = true; }).catch(err => {
    console.error('Playback error:', err);
    showError(`Failed to play "${currentTrack.value?.name || 'Unknown file'}"`);
    isPlaying.value = false;
    nextTrack();
  });
}

function onMediaError() {
  showError(`Cannot play "${currentTrack.value?.name || 'Unknown file'}" — skipped`);
  nextTrack();
}

function stopMedia() { stopCurrentMedia(); isPlaying.value = false; currentTime.value = 0; duration.value = 0; progressPercent.value = 0; }

function togglePlay() {
  const media = getActiveMedia();
  if (!media?.src || currentIndex.value === -1) { if (playlist.value.length > 0) playIndex(0); return; }
  if (isPlaying.value) { media.pause(); isPlaying.value = false; }
  else {
    media.play().then(() => { isPlaying.value = true; }).catch(err => {
      console.error('Play failed:', err);
      showError(`Cannot play "${currentTrack.value?.name || 'Unknown file'}"`);
      isPlaying.value = false;
    });
  }
}

function nextTrack() {
  if (playlist.value.length === 0) return;
  if (currentTrack.value) addToHistory(currentTrack.value);
  if (isShuffle.value) {
    const available = playlist.value.map((_, i) => i).filter(i => i !== currentIndex.value);
    if (available.length === 0) {
      if (repeatMode.value === 1) { playIndex(Math.floor(Math.random() * playlist.value.length)); } else { stopMedia(); currentIndex.value = -1; }
      return;
    }
    playIndex(available[Math.floor(Math.random() * available.length)]);
    return;
  }
  let next = currentIndex.value + 1;
  if (next >= playlist.value.length) {
    if (repeatMode.value === 1) next = 0; else { stopMedia(); currentIndex.value = -1; return; }
  }
  playIndex(next);
}

function prevTrack() {
  if (playlist.value.length === 0) return;
  const media = getActiveMedia();
  if (media && media.currentTime > 3) { media.currentTime = 0; return; }
  let prev = currentIndex.value - 1;
  if (prev < 0) { if (repeatMode.value === 1) prev = playlist.value.length - 1; else return; }
  playIndex(prev);
}

function toggleShuffle() { isShuffle.value = !isShuffle.value; }
function toggleRepeat() { repeatMode.value = (repeatMode.value + 1) % 3; }

function cycleSpeed() {
  const idx = SPEEDS.indexOf(currentSpeed.value);
  currentSpeed.value = SPEEDS[(idx + 1) % SPEEDS.length];
  if (videoPlayer.value) videoPlayer.value.playbackRate = currentSpeed.value;
  if (audioPlayer.value) audioPlayer.value.playbackRate = currentSpeed.value;
}

// ==================== PROGRESS ====================
function onTimeUpdate() {
  const media = getActiveMedia();
  if (!media || !media.duration || isNaN(media.duration)) return;
  if (!isDragging.value) {
    currentTime.value = media.currentTime;
    duration.value = media.duration;
    progressPercent.value = (media.currentTime / media.duration) * 100;
  }
}

function onProgressMouseDown(e) { isDragging.value = true; doSeek(e); }

function doSeek(e) {
	const media = getActiveMedia();
	if (!media?.duration) return;
	const el = progressBar.value || e.currentTarget;
	const rect = el.getBoundingClientRect();
	const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
	const pct = x / rect.width;
	media.currentTime = pct * media.duration;
	currentTime.value = media.currentTime;
	progressPercent.value = pct * 100;
}

function seekProgress(e) { doSeek(e); }

// ==================== VOLUME ====================
function setVolume(val) {
  volume.value = val;
  if (videoPlayer.value) videoPlayer.value.volume = val / 100;
  if (audioPlayer.value) audioPlayer.value.volume = val / 100;
}

function toggleMute() {
  if (volume.value > 0) { previousVolume.value = volume.value; setVolume(0); }
  else setVolume(previousVolume.value);
}

// ==================== FULLSCREEN & PIP ====================
async function toggleFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.body.requestFullscreen();
}

async function togglePiP() {
  if (document.pictureInPictureElement) await document.exitPictureInPicture();
  else if (videoPlayer.value) { try { await videoPlayer.value.requestPictureInPicture(); } catch (e) { console.error('PiP error:', e); } }
}

function onMediaEnded() {
	if (currentTrack.value) addToHistory(currentTrack.value);
	if (repeatMode.value === 2) {
		const media = getActiveMedia();
		if (media) { media.currentTime = 0; media.play().then(() => { isPlaying.value = true; }); }
	} else { nextTrack(); }
}

// ==================== FILE DIALOGS ====================
async function openFiles() {
  if (window.electronAPI) { const files = await window.electronAPI.openFile(); if (files.length > 0) handleFiles(files); }
}
async function openFolder() {
  if (window.electronAPI) { const files = await window.electronAPI.openFolder(); if (files.length > 0) handleFiles(files); }
}

// ==================== DRAG & DROP ====================
function onDragEnter(e) { e.preventDefault(); dragCounter++; if (dragCounter === 1) dropActive.value = true; }
function onDragLeave(e) { e.preventDefault(); dragCounter--; if (dragCounter === 0) dropActive.value = false; }
function onDragOver(e) { e.preventDefault(); }
function onDrop(e) {
	e.preventDefault(); dragCounter = 0; dropActive.value = false;
	const files = Array.from(e.dataTransfer.files).map(f => f.path);
	if (files.length > 0) handleFiles(files);
}

// ==================== KEYBOARD ====================
function onKeyDown(e) {
	if (e.target.tagName === 'INPUT') return;

  if (e.code === 'Escape') {
    if (document.pictureInPictureElement) { document.exitPictureInPicture(); return; }
    if (currentView.value !== 'player') { backToPlayer(); return; }
  }

  if (currentView.value === 'player') {
    switch (e.code) {
      case 'Space': e.preventDefault(); togglePlay(); break;
      case 'ArrowLeft': if (e.ctrlKey || e.metaKey) prevTrack(); else { const m = getActiveMedia(); if (m) m.currentTime = Math.max(0, m.currentTime - 5); } break;
      case 'ArrowRight': if (e.ctrlKey || e.metaKey) nextTrack(); else { const m = getActiveMedia(); if (m) m.currentTime = Math.min(m.duration || 0, m.currentTime + 5); } break;
      case 'ArrowUp': e.preventDefault(); setVolume(Math.min(100, volume.value + 5)); break;
      case 'ArrowDown': e.preventDefault(); setVolume(Math.max(0, volume.value - 5)); break;
      case 'KeyM': toggleMute(); break;
      case 'KeyF': toggleFullscreen(); break;
    }
  }

  if (currentView.value === 'image') {
    switch (e.code) {
      case 'ArrowLeft': prevImage(); break;
      case 'ArrowRight': nextImage(); break;
      case 'KeyF': toggleFullscreen(); break;
    }
  }

  if (currentView.value === 'pdf') {
    if (e.code === 'KeyF') toggleFullscreen();
  }
}

// ==================== MENU EVENTS ====================
function setupMenuListeners() {
  if (window.electronAPI) {
    window.electronAPI.onMenuAction('playback-toggle', togglePlay);
    window.electronAPI.onMenuAction('playback-stop', stopMedia);
    window.electronAPI.onMenuAction('playlist-next', nextTrack);
    window.electronAPI.onMenuAction('playlist-prev', prevTrack);
    window.electronAPI.onMenuAction('files-opened', (filePaths) => { handleFiles(filePaths); });
    window.electronAPI.onMenuAction('theme-changed', (theme) => { currentTheme.value = theme; });
  }
}

// ==================== GLOBAL MOUSE EVENTS ====================
function onMouseUp() { isDragging.value = false; }
function onMouseMove(e) {
  if (isDragging.value) {
    const el = progressBar.value || document.querySelector('.vlc-progress');
    if (el) doSeek({ currentTarget: el, clientX: e.clientX });
  }
}

// ==================== LIFECYCLE ====================
onMounted(() => {
  setupMenuListeners();
  document.addEventListener('dragenter', onDragEnter);
  document.addEventListener('dragleave', onDragLeave);
  document.addEventListener('dragover', onDragOver);
  document.addEventListener('drop', onDrop);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('mousemove', onMouseMove);

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new Tooltip(el));

  setVolume(80);
});

onUnmounted(() => {
  document.removeEventListener('dragenter', onDragEnter);
  document.removeEventListener('dragleave', onDragLeave);
  document.removeEventListener('dragover', onDragOver);
  document.removeEventListener('drop', onDrop);
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('mousemove', onMouseMove);
  clearTimeout(hideTimer);
});
</script>

<style>
html, body, #app { height: 100%; overflow: hidden; }

.video-area { cursor: default; }

.vlc-progress { cursor: pointer; }
.vlc-progress:hover { height: 6px !important; --tblr-progress-height: 6px; }

.vis-bar {
  width: 3px; height: 3px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  transition: height 80ms ease;
}
.vis-bar.playing {
  background: var(--tblr-primary, #7c3aed);
  animation: viz-bounce 600ms ease-in-out infinite alternate;
}
@keyframes viz-bounce {
  0% { height: 3px; }
  100% { height: 20px; }
}

.controls-overlay { pointer-events: auto; }
.controls-overlay .btn-icon { color: rgba(255,255,255,0.85) !important; }
.controls-overlay .btn-icon:hover { color: #fff !important; background: rgba(255,255,255,0.1); }
.controls-overlay .btn-icon.text-primary { color: var(--tblr-primary, #7c3aed) !important; }

.list-group-item .remove-btn { opacity: 0; transition: opacity 150ms; }
.list-group-item:hover .remove-btn { opacity: 1; }

#playlistOffcanvas .offcanvas-body { display: flex; flex-direction: column; }

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.photo-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: #111;
  border: 2px solid transparent;
  transition: border-color 150ms, transform 150ms;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}
.photo-item:hover {
  border-color: var(--tblr-primary, #7c3aed);
  transform: scale(1.02);
}
.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 300ms ease;
  background: #1a1a1f;
}
.photo-item img[src] {
  opacity: 1;
}
.photo-name {
  padding: 4px 8px;
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  background: rgba(0,0,0,0.6);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
