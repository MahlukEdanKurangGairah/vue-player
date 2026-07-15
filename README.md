# 🎬 VPlayer

> Minimal, sleek video & music player built with Electron — no bloat, just play.

![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron)
![Vue](https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js)
![Vuetify](https://img.shields.io/badge/Vuetify-3.5-1867C0?logo=vuetify)
![Bun](https://img.shields.io/badge/Bun-latest-FBF0DF?logo=bun)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

| | |
|---|---|
| 🎬 **Video Player** | Full HTML5 video with now-playing overlay |
| 🎵 **Audio Player** | Artwork display + animated bar visualizer |
| 📂 **File Support** | MP4, WebM, MKV, AVI, MOV, MP3, FLAC, OGG, WAV, AAC, M4A, Opus |
| 📋 **Playlist** | Add/remove/clear, click to play, alphabetical sort |
| 📜 **History** | Last 50 played tracks in sidebar |
| 🔀 **Shuffle** | Randomize playback order |
| 🔁 **Repeat** | Repeat all / Repeat one |
| 🔊 **Volume** | Slider + mute toggle |
| ⏩ **Speed** | 0.25× to 2× playback rate |
| 🖼 **Picture-in-Picture** | PiP for video (always on top) |
| ⛶ **Fullscreen** | Toggle fullscreen mode |
| 📥 **Drag & Drop** | Drop files directly from file manager |
| ⌨️ **Keyboard Shortcuts** | Full keyboard control |
| 🌙 **Dark Theme** | Material Design 3 dark theme (purple accent) |

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
# Build all platforms
bun run build

# Platform-specific
bun run build:linux    # AppImage + .deb
bun run build:win      # NSIS installer
bun run build:mac      # DMG
```

Output goes to `dist/` folder. The renderer is built by Vite into `dist-app/` first, then packaged by electron-builder.

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `←` | Seek back 5s |
| `→` | Seek forward 5s |
| `Ctrl` + `←` | Previous track |
| `Ctrl` + `→` | Next track |
| `↑` | Volume up |
| `↓` | Volume down |
| `M` | Mute / Unmute |
| `F` | Toggle fullscreen |
| `Ctrl` + `O` | Open file(s) |
| `Ctrl` + `Shift` + `O` | Open folder |
| `Ctrl` + `.` | Stop playback |
| `Esc` | Exit PiP |

## 🧱 Project Structure

```
vplayer/
├── main.js              # Electron main process, menu, IPC, file dialogs
├── preload.js           # Context bridge (secure IPC to renderer)
├── index.html           # HTML entry point (mounts Vue app)
├── package.json         # Dependencies & build config
├── vite.config.js       # Vite config (Vue plugin, chunk splitting)
├── src/
│   ├── main.js          # Vue app entry — creates Vuetify, mounts App
│   └── App.vue          # Full UI: player, playlist, controls, history
├── legacy/              # Original vanilla-JS implementation (reference only)
│   ├── renderer.js
│   └── style.css
├── dist-app/            # Vite build output (committed, shipped in package)
└── dist/                # electron-builder output (AppImage, .deb, .exe, .dmg)
```

## 🛠️ Architecture

### Process Model

- **Main Process** (`main.js`) — Window management, native menus, file dialogs, folder scanning, IPC handlers. All media extensions and dialog filters are defined once as shared constants.
- **Preload** (`preload.js`) — Exposes `window.electronAPI` via context bridge with whitelisted channels
- **Renderer** — Vue 3 app built with Vite. Uses Vuetify 3 component library (Material Design 3). State managed via Vue Composition API (`ref`, `computed`, `watch`) in a single `<script setup>` block.

### Security

- `nodeIntegration: false` — no Node.js in renderer
- `contextIsolation: true` — sandboxed preload bridge
- Content Security Policy enforced via meta tag in `index.html`
- IPC channels whitelisted both in preload and main

### Dev vs Production Loading

- **Dev**: `main.js` checks `VITE_DEV_SERVER_URL` env var; loads from `http://localhost:5173`
- **Production**: loads `dist-app/index.html` from disk

## 🎨 Theming

VPlayer uses Vuetify's dark theme with a purple accent. Customize colors in `src/main.js`:

```js
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          background: '#0a0a0f',
          surface: '#12121a',
          primary: '#7c3aed',       // Change this
          secondary: '#8b5cf6'      // And this
        }
      }
    }
  }
});
```

## 📝 Supported Formats

### Video
MP4, WebM, MKV, AVI, MOV, M4V

### Audio
MP3, FLAC, OGG, WAV, AAC, M4A, Opus

## 🔧 Tech Stack

- **[Electron 28](https://www.electronjs.org/)** — Desktop app framework
- **[Vue 3](https://vuejs.org/)** — UI framework (Composition API)
- **[Vuetify 3](https://vuetifyjs.com/)** — Material Design 3 component library
- **[Vite 5](https://vitejs.dev/)** — Build tool & dev server
- **[Bun](https://bun.sh/)** — Package manager & runtime
- **[electron-builder](https://www.electron.build/)** — Build/packaging

## 📄 License

MIT © Omen

---

*Built for people who just want their media to play — no ads, no tracking, no nonsense.*
