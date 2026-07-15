// === DOM Elements ===
const videoContainer = document.getElementById('video-container');
const videoPlayer = document.getElementById('video-player');
const videoOverlay = document.getElementById('video-overlay');
const npTitle = document.getElementById('np-title');
const audioContainer = document.getElementById('audio-container');
const audioPlayer = document.getElementById('audio-player');
const audioTitle = document.getElementById('audio-title');
const audioSubtitle = document.getElementById('audio-subtitle');
const artworkVisualizer = document.getElementById('artwork-visualizer');
const artworkIcon = document.getElementById('artwork-icon');
const timeCurrent = document.getElementById('time-current');
const timeDuration = document.getElementById('time-duration');
const progressBarWrapper = document.getElementById('progress-bar-wrapper');
const progressFill = document.getElementById('progress-fill');
const progressThumb = document.getElementById('progress-thumb');
const btnPlay = document.getElementById('btn-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnShuffle = document.getElementById('btn-shuffle');
const btnRepeat = document.getElementById('btn-repeat');
const btnVolume = document.getElementById('btn-volume');
const volumeSlider = document.getElementById('volume-slider');
const btnSpeed = document.getElementById('btn-speed');
const btnPip = document.getElementById('btn-pip');
const btnFullscreen = document.getElementById('btn-fullscreen');
const playlistPanel = document.getElementById('playlist-panel');
const playlistCount = document.getElementById('playlist-count');
const playlistEl = document.getElementById('playlist');
const btnAddFiles = document.getElementById('btn-add-files');
const btnAddFolder = document.getElementById('btn-add-folder');
const btnPlaylistClear = document.getElementById('btn-playlist-clear');
const btnPlaylistToggle = document.getElementById('btn-playlist-toggle');
const dropOverlay = document.getElementById('drop-overlay');

// === State ===
let playlist = [];
let currentIndex = -1;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0; // 0=none, 1=all, 2=one
let currentSpeed = 1;
let isDragging = false;
let isVideo = false;

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const AUDIO_EXTS = ['mp3', 'flac', 'ogg', 'wav', 'aac', 'm4a', 'opus', 'wma'];
const VIDEO_EXTS = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'm4v', 'wmv'];

// === Active Media Element ===
function getActiveMedia() {
  return isVideo ? videoPlayer : audioPlayer;
}

// === File Helpers ===
function getFileExtension(filePath) {
  return filePath.split('.').pop().toLowerCase();
}

function getFileName(filePath) {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const fullName = parts[parts.length - 1];
  return fullName.replace(/\.[^/.]+$/, '');
}

function isAudioFile(filePath) {
  return AUDIO_EXTS.includes(getFileExtension(filePath));
}

function isVideoFile(filePath) {
  return VIDEO_EXTS.includes(getFileExtension(filePath));
}

function getFileIcon(filePath) {
  return isVideoFile(filePath) ? '🎬' : '🎵';
}

// === Format Time ===
function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// === Playlist ===
function addToPlaylist(filePaths) {
  const newItems = filePaths.filter(fp => {
    const ext = getFileExtension(fp);
    return AUDIO_EXTS.includes(ext) || VIDEO_EXTS.includes(ext);
  });

  if (newItems.length === 0) return;

  newItems.forEach(fp => {
    if (!playlist.find(p => p.path === fp)) {
      playlist.push({
        path: fp,
        name: getFileName(fp),
        type: isVideoFile(fp) ? 'video' : 'audio'
      });
    }
  });

  renderPlaylist();
  updatePlaylistCount();

  if (currentIndex === -1 && playlist.length > 0) {
    playIndex(0);
  }
}

function removeFromPlaylist(index) {
  if (index === currentIndex) {
    // Stop current
    stopMedia();
    currentIndex = -1;
  } else if (index < currentIndex) {
    currentIndex--;
  }

  playlist.splice(index, 1);
  renderPlaylist();
  updatePlaylistCount();

  if (playlist.length === 0) {
    resetUI();
  }
}

function clearPlaylist() {
  stopMedia();
  playlist = [];
  currentIndex = -1;
  renderPlaylist();
  updatePlaylistCount();
  resetUI();
}

function renderPlaylist() {
  playlistEl.innerHTML = '';

  playlist.forEach((item, index) => {
    const li = document.createElement('li');
    if (index === currentIndex) li.classList.add('active');

    li.innerHTML = `
      <span class="pl-index">${index === currentIndex ? '▶' : (index + 1)}</span>
      <span class="pl-icon">${getFileIcon(item.path)}</span>
      <span class="pl-name" title="${item.name}">${item.name}</span>
      <span class="pl-duration"></span>
      <button class="pl-remove" data-index="${index}">✕</button>
    `;

    li.addEventListener('click', (e) => {
      if (!e.target.classList.contains('pl-remove')) {
        playIndex(index);
      }
    });

    li.querySelector('.pl-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromPlaylist(index);
    });

    playlistEl.appendChild(li);
  });

  // Scroll active into view
  if (currentIndex >= 0) {
    setTimeout(() => {
      const active = playlistEl.querySelector('li.active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    }, 50);
  }
}

function updatePlaylistCount() {
  playlistCount.textContent = `Playlist (${playlist.length})`;
}

// === Media Control ===
function playIndex(index) {
  if (index < 0 || index >= playlist.length) return;

  const item = playlist[index];
  const wasVideo = isVideo;
  isVideo = item.type === 'video';

  currentIndex = index;

  // Switch media element if type changed
  if (wasVideo && !isVideo) {
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
  } else if (!wasVideo && isVideo) {
    audioPlayer.pause();
    audioPlayer.removeAttribute('src');
  }

  const media = getActiveMedia();

  // Handle file:// protocol
  const fileUrl = `file://${item.path}`;

  media.src = fileUrl;
  media.load();

  updateUIForType();

  media.onloadedmetadata = () => {
    timeDuration.textContent = formatTime(media.duration);
    media.play().then(() => {
      isPlaying = true;
      updatePlayButton();
      updateArtwork(true);
    }).catch(err => {
      console.error('Playback failed:', err);
      isPlaying = false;
      updatePlayButton();
      updateArtwork(false);
    });
  };

  media.onerror = () => {
    console.error('Media error — skipping file');
    nextTrack();
  };

  // Update now-playing info
  const title = item.name;
  npTitle.textContent = title;
  audioTitle.textContent = title;
  audioSubtitle.textContent = item.type === 'video' ? 'Video' : 'Audio';

  renderPlaylist();
  updatePlaylistCount();
}

function stopMedia() {
  videoPlayer.pause();
  videoPlayer.removeAttribute('src');
  audioPlayer.pause();
  audioPlayer.removeAttribute('src');
  isPlaying = false;
  updatePlayButton();
  updateArtwork(false);
}

function togglePlay() {
  const media = getActiveMedia();
  if (!media.src || currentIndex === -1) {
    if (playlist.length > 0) playIndex(0);
    return;
  }

  if (isPlaying) {
    media.pause();
    isPlaying = false;
    updateArtwork(false);
  } else {
    media.play().catch(console.error);
    isPlaying = true;
    updateArtwork(true);
  }
  updatePlayButton();
}

function nextTrack() {
  if (playlist.length === 0) return;

  if (isShuffle) {
    const next = Math.floor(Math.random() * playlist.length);
    playIndex(next);
    return;
  }

  let next = currentIndex + 1;
  if (next >= playlist.length) {
    if (repeatMode === 1) {
      next = 0;
    } else {
      stopMedia();
      currentIndex = -1;
      renderPlaylist();
      resetUI();
      return;
    }
  }
  playIndex(next);
}

function prevTrack() {
  if (playlist.length === 0) return;

  // If more than 3 seconds in, restart current track
  const media = getActiveMedia();
  if (media.currentTime > 3) {
    media.currentTime = 0;
    return;
  }

  let prev = currentIndex - 1;
  if (prev < 0) {
    if (repeatMode === 1) {
      prev = playlist.length - 1;
    } else {
      return;
    }
  }
  playIndex(prev);
}

function updateUIForType() {
  if (isVideo) {
    videoContainer.classList.remove('hidden');
    audioContainer.classList.add('hidden');
    btnPip.classList.remove('hidden');
    document.body.classList.add('video-mode');
  } else {
    videoContainer.classList.add('hidden');
    audioContainer.classList.remove('hidden');
    btnPip.classList.add('hidden');
    document.body.classList.remove('video-mode');
  }
}

function resetUI() {
  isVideo = false;
  videoContainer.classList.add('hidden');
  audioContainer.classList.remove('hidden');
  btnPip.classList.add('hidden');
  document.body.classList.remove('video-mode');
  audioTitle.textContent = 'VPlayer';
  audioSubtitle.textContent = 'Drag & drop media files or open a folder';
  npTitle.textContent = '';
  timeCurrent.textContent = '00:00';
  timeDuration.textContent = '00:00';
  progressFill.style.width = '0%';
  progressThumb.style.left = '0%';
  artworkIcon.textContent = '🎵';
  updateArtwork(false);
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  btnShuffle.classList.toggle('active', isShuffle);
}

function toggleRepeat() {
  repeatMode = (repeatMode + 1) % 3;
  btnRepeat.classList.remove('active');
  if (repeatMode === 1) {
    btnRepeat.textContent = '🔁';
    btnRepeat.classList.add('active');
  } else if (repeatMode === 2) {
    btnRepeat.textContent = '🔂';
    btnRepeat.classList.add('active');
  } else {
    btnRepeat.textContent = '🔁';
  }
}

function updatePlayButton() {
  btnPlay.textContent = isPlaying ? '⏸' : '▶';
}

function updateArtwork(playing) {
  if (playing) {
    artworkVisualizer.classList.add('playing');
  } else {
    artworkVisualizer.classList.remove('playing');
  }
}

// === Progress ===
function updateProgress() {
  const media = getActiveMedia();
  if (!media.duration || isNaN(media.duration)) return;

  const pct = (media.currentTime / media.duration) * 100;
  progressFill.style.width = `${pct}%`;
  progressThumb.style.left = `${pct}%`;
  timeCurrent.textContent = formatTime(media.currentTime);
}

function seekProgress(e) {
  const media = getActiveMedia();
  if (!media.duration) return;

  const rect = progressBarWrapper.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const pct = x / rect.width;
  media.currentTime = pct * media.duration;
}

// === Volume ===
function updateVolumeUI() {
  const vol = volumeSlider.value;
  volumeSlider.style.background = `linear-gradient(to right, var(--accent) ${vol}%, var(--progress-bg) ${vol}%)`;

  if (vol == 0) {
    btnVolume.textContent = '🔇';
  } else if (vol < 50) {
    btnVolume.textContent = '🔉';
  } else {
    btnVolume.textContent = '🔊';
  }
}

function setVolume(value) {
  volumeSlider.value = value;
  videoPlayer.volume = value / 100;
  audioPlayer.volume = value / 100;
  updateVolumeUI();
}

function toggleMute() {
  if (volumeSlider.value > 0) {
    volumeSlider.dataset.prevVolume = volumeSlider.value;
    setVolume(0);
  } else {
    setVolume(volumeSlider.dataset.prevVolume || 80);
  }
}

// === Speed ===
function cycleSpeed() {
  const idx = SPEEDS.indexOf(currentSpeed);
  const nextIdx = (idx + 1) % SPEEDS.length;
  currentSpeed = SPEEDS[nextIdx];
  videoPlayer.playbackRate = currentSpeed;
  audioPlayer.playbackRate = currentSpeed;
  btnSpeed.textContent = `${currentSpeed}×`;
}

// === Fullscreen ===
async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await document.body.requestFullscreen();
    if (isVideo) {
      videoPlayer.style.objectFit = 'contain';
    }
  }
}

// === PiP ===
async function togglePiP() {
  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  } else if (isVideo) {
    try {
      await videoPlayer.requestPictureInPicture();
    } catch (e) {
      console.error('PiP failed:', e);
    }
  }
}

// === Drag & Drop ===
let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragCounter++;
  if (dragCounter === 1) {
    dropOverlay.classList.remove('hidden');
  }
});

document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    dropOverlay.classList.add('hidden');
  }
});

document.addEventListener('dragover', (e) => {
  e.preventDefault();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.classList.add('hidden');

  const files = Array.from(e.dataTransfer.files).map(f => f.path);
  if (files.length > 0) {
    addToPlaylist(files);
  }
});

// === Keyboard Shortcuts ===
document.addEventListener('keydown', (e) => {
  // Don't trigger when typing in inputs
  if (e.target.tagName === 'INPUT') return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowLeft':
      if (e.ctrlKey || e.metaKey) {
        prevTrack();
      } else {
        const media = getActiveMedia();
        media.currentTime = Math.max(0, media.currentTime - 5);
      }
      break;
    case 'ArrowRight':
      if (e.ctrlKey || e.metaKey) {
        nextTrack();
      } else {
        const media = getActiveMedia();
        media.currentTime = Math.min(media.duration || 0, media.currentTime + 5);
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      setVolume(Math.min(100, parseInt(volumeSlider.value) + 5));
      break;
    case 'ArrowDown':
      e.preventDefault();
      setVolume(Math.max(0, parseInt(volumeSlider.value) - 5));
      break;
    case 'KeyM':
      toggleMute();
      break;
    case 'KeyF':
      toggleFullscreen();
      break;
    case 'Escape':
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      }
      break;
  }
});

// === Menu Events (from main process) ===
if (window.electronAPI) {
  window.electronAPI.onMenuAction('playback-toggle', () => togglePlay());
  window.electronAPI.onMenuAction('playback-stop', () => stopMedia());
  window.electronAPI.onMenuAction('playlist-next', () => nextTrack());
  window.electronAPI.onMenuAction('playlist-prev', () => prevTrack());
  window.electronAPI.onMenuAction('files-opened', (filePaths) => {
    addToPlaylist(filePaths);
  });
}

// === Event Listeners ===
btnPlay.addEventListener('click', togglePlay);
btnPrev.addEventListener('click', prevTrack);
btnNext.addEventListener('click', nextTrack);
btnShuffle.addEventListener('click', toggleShuffle);
btnRepeat.addEventListener('click', toggleRepeat);
btnPip.addEventListener('click', togglePiP);
btnFullscreen.addEventListener('click', toggleFullscreen);

btnPlaylistClear.addEventListener('click', clearPlaylist);
btnPlaylistToggle.addEventListener('click', () => {
  playlistPanel.classList.toggle('hidden');
  btnPlaylistToggle.textContent = playlistPanel.classList.contains('hidden') ? '▲' : '▼';
});

btnAddFiles.addEventListener('click', async () => {
  if (window.electronAPI) {
    const files = await window.electronAPI.openFile();
    if (files.length > 0) addToPlaylist(files);
  }
});

btnAddFolder.addEventListener('click', async () => {
  if (window.electronAPI) {
    const files = await window.electronAPI.openFolder();
    if (files.length > 0) addToPlaylist(files);
  }
});

btnVolume.addEventListener('click', toggleMute);

volumeSlider.addEventListener('input', () => {
  setVolume(volumeSlider.value);
});

btnSpeed.addEventListener('click', cycleSpeed);

// Progress bar
progressBarWrapper.addEventListener('mousedown', (e) => {
  isDragging = true;
  seekProgress(e);
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) seekProgress(e);
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// Media time update
videoPlayer.addEventListener('timeupdate', updateProgress);
audioPlayer.addEventListener('timeupdate', updateProgress);

// Media ended
videoPlayer.addEventListener('ended', () => {
  if (repeatMode === 2) {
    videoPlayer.currentTime = 0;
    videoPlayer.play();
  } else {
    nextTrack();
  }
});

audioPlayer.addEventListener('ended', () => {
  if (repeatMode === 2) {
    audioPlayer.currentTime = 0;
    audioPlayer.play();
  } else {
    nextTrack();
  }
});

// Auto-hide video overlay
let overlayTimeout;
videoContainer.addEventListener('mousemove', () => {
  videoOverlay.classList.remove('hidden');
  clearTimeout(overlayTimeout);
  overlayTimeout = setTimeout(() => {
    videoOverlay.classList.add('hidden');
  }, 3000);
});

videoContainer.addEventListener('mouseleave', () => {
  clearTimeout(overlayTimeout);
  overlayTimeout = setTimeout(() => {
    videoOverlay.classList.add('hidden');
  }, 1000);
});

// Initialize volume
setVolume(80);

// Initial UI state
resetUI();
