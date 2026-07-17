# 🎬 AdjadTeaPlayer

> Desktop media player built with Electron + Vue 3 + Tabler — video, audio, images & PDF in one app.

![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron)
![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)
![Tabler](https://img.shields.io/badge/Tabler-1.4-0054a6?logo=tabler)
![Bun](https://img.shields.io/badge/Bun-latest-FBF0DF?logo=bun)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

| | |
|---|---|
| 🎬 **Video Player** | Full-screen HTML5 video, VLC-style auto-hiding controls |
| 🎵 **Audio Player** | Artwork display + animated bar visualizer overlay |
| 🖼 **Image Viewer** | Fullscreen image viewer with prev/next navigation |
| 🗂 **Photo Grid** | Grid thumbnails when opening a folder of images |
| 📄 **PDF Reader** | Chromium built-in PDF viewer via `<embed>` |
| 📂 **File Support** | MP4, WebM, MKV, AVI, MOV, MP3, FLAC, OGG, WAV, AAC, M4A, Opus, JPG, PNG, GIF, WebP, SVG, PDF |
| 📋 **Playlist** | Offcanvas drawer (right) — add/remove/clear, click to play |
| 📜 **History** | Last 50 played tracks in offcanvas drawer |
| 🔀 **Shuffle** | Randomize playback order |
| 🔁 **Repeat** | Repeat all / Repeat one |
| 🔊 **Volume** | Slider + mute toggle (remembers previous volume) |
| ⏩ **Speed** | 0.25× to 2× playback rate |
| 🖼 **Picture-in-Picture** | PiP for video (always on top) |
| ⛶ **Fullscreen** | Toggle fullscreen mode |
| 📥 **Drag & Drop** | Drop files directly from file manager |
| ⌨️ **Keyboard Shortcuts** | Full keyboard control |
| 🌙 **Dark/Light Theme** | Toggle via View → Theme menu |

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Run in development (Vite hot-reload + Electron)
bun run dev

# Run against production build
bun run start
```

## 📦 Build

```bash
# Build for Linux (AppImage + .deb)
bun run build:linux

# Build all platforms
bun run build
```

Output goes to `dist/` folder.

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `←` | Seek back 5s / Prev image |
| `→` | Seek forward 5s / Next image |
| `Ctrl` + `←` | Previous track |
| `Ctrl` + `→` | Next track |
| `↑` | Volume up |
| `↓` | Volume down |
| `M` | Mute / Unmute |
| `F` | Toggle fullscreen |
| `Esc` | Back to player (from image/PDF view) / Exit PiP |
| `Ctrl` + `O` | Open file(s) |
| `Ctrl` + `Shift` + `O` | Open folder |
| `Ctrl` + `.` | Stop playback |

## 🧱 Project Structure

```
adjadteaplayer/
├── main.js              # Electron main process, menu, IPC, file dialogs
├── preload.js           # Context bridge (secure IPC to renderer)
├── index.html           # HTML entry point (mounts Vue app)
├── package.json         # Dependencies & build config
├── vite.config.js       # Vite config (Vue plugin, chunk splitting)
├── src/
│   ├── main.js              # Vue app entry — imports Tabler CSS + Bootstrap JS
│   ├── App.vue              # Root component — state, file routing, keyboard, menu
│   └── components/
│       ├── PlayerView.vue   # Video/audio player + controls overlay
│       ├── ImageViewer.vue  # Fullscreen single image viewer
│       ├── PhotoGrid.vue    # Lazy-loaded image thumbnails grid
│       └── PdfViewer.vue    # Chromium PDF embed + top bar
├── legacy/              # Original vanilla-JS implementation (reference only)
│   ├── renderer.js
│   └── style.css
├── dist-app/            # Vite build output
└── dist/                # electron-builder output (AppImage, .deb)
```

## 🛠️ Architecture

### Process Model

- **Main Process** (`main.js`) — Window management, native menus (File/Playback/View/Theme), file dialogs, folder scanning, IPC handlers
- **Preload** (`preload.js`) — Exposes `window.electronAPI` via context bridge with whitelisted channels
- **Renderer** — Vue 3 app built with Vite. Uses Tabler CSS framework + Bootstrap 5. Tabler Icons rendered as Vue components (`@tabler/icons-vue`). State managed via Vue Composition API (`ref`, `computed`). Four view modes (player, image viewer, photo grid, PDF reader) split into separate Vue SFC components. Photo grid uses `lozad` for lazy image loading.

### UI Design

- **VLC-style**: video fills entire window, no permanent chrome
- **Auto-hiding controls overlay**: appears on mouse move, disappears after 2.5s idle
- **Playlist**: Bootstrap offcanvas drawer slides from the right
- **Progress bar**: full-width, green (`#39ff14`), 4px (6px on hover)
- **Theme**: dark/light toggle via native menu (View → Theme), applied as `data-bs-theme`

### Security

- `nodeIntegration: false` — no Node.js in renderer
- `contextIsolation: true` — sandboxed preload bridge
- Content Security Policy enforced via meta tag in `index.html`
- IPC channels whitelisted both in preload and main

### Dev vs Production Loading

- **Dev**: `main.js` checks `VITE_DEV_SERVER_URL` env var; loads from `http://localhost:5173`
- **Production**: loads `dist-app/index.html` from disk

## 📝 Supported Formats

### Video
MP4, WebM, MKV, AVI, MOV, M4V

### Audio
MP3, FLAC, OGG, WAV, AAC, M4A, Opus

### Images
JPG, JPEG, PNG, GIF, BMP, WebP, SVG, ICO

### Documents
PDF

## 🔧 Tech Stack

- **[Electron 28](https://www.electronjs.org/)** — Desktop app framework
- **[Vue 3](https://vuejs.org/)** — UI framework (Composition API)
- **[Tabler](https://tabler.io/)** — Bootstrap 5 CSS framework + UI kit
- **[Tabler Icons Vue](https://www.npmjs.com/package/@tabler/icons-vue)** — SVG icon components
- **[lozad](https://apoorv.pro/lozad.js/)** — Lazy loading for image thumbnails
- **[Vite 5](https://vitejs.dev/)** — Build tool & dev server
- **[Bun](https://bun.sh/)** — Package manager & runtime
- **[electron-builder](https://www.electron.build/)** — Build/packaging

## 📄 License

MIT © AdjadTea

---

*Built for people who just want their media to play — no ads, no tracking, no nonsense.*
