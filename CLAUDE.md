# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install              # Install dependencies (Bun is the package manager)
bun run dev              # Dev mode: starts Vite dev server + Electron (VITE_DEV_SERVER_URL=http://localhost:5173)
bun run start            # Run Electron against already-built dist-app/
bun run build            # Production build: Vite build → dist-app/, then electron-builder → dist/
bun run build:linux      # Build for Linux only (AppImage + .deb)
bun run build:win        # Build for Windows only (NSIS installer)
bun run build:mac        # Build for macOS only (DMG)
```

There are no tests in this project.

## Architecture

VPlayer is an Electron 28 desktop media player. It plays local video (MP4, WebM, MKV, AVI, MOV) and audio (MP3, FLAC, OGG, WAV, AAC, M4A, Opus) files.

**Process model (3 processes):**

1. **Main process** (`main.js`) — Electron main process. Creates the `BrowserWindow`, builds the native application menu (File / Playback / View), handles file/folder open dialogs, recursively scans folders for media files, and registers IPC handlers (`dialog:openFile`, `dialog:openFolder`, `app:getPath`, `fs:fileExists`). Sends menu actions to the renderer via `webContents.send()`.

2. **Preload** (`preload.js`) — Context bridge. Exposes `window.electronAPI` to the renderer with a whitelist of IPC channels (`playback-toggle`, `playback-stop`, `playlist-next`, `playlist-prev`, `files-opened`). This is the only bridge between main and renderer processes.

3. **Renderer** — The UI is built with **Vue 3** (Composition API, `<script setup>`) and **Tabler CSS** (Bootstrap 5) + **Tabler Icons Vue** for SVG icon components. Vite compiles `src/main.js` (Vue app entry) and `src/App.vue` into `dist-app/`. The root `index.html` mounts `#app` and loads `src/main.js`. Tabler Icons are imported as Vue components from `@tabler/icons-vue`.

**Security model (enforced, do not weaken):**
- `nodeIntegration: false` — no Node.js APIs in renderer
- `contextIsolation: true` — renderer only accesses APIs through the preload bridge
- IPC channels are whitelisted in both `preload.js` and processed in `main.js`

**Dev vs production loading:**
- Dev: `main.js` checks `VITE_DEV_SERVER_URL` env var; if set, loads from `http://localhost:5173`
- Production: loads `dist-app/index.html` from disk

**Legacy code note:** `legacy/renderer.js` and `legacy/style.css` are the original vanilla-JS implementation. They are **not used** by the current app — the active UI is entirely in `src/App.vue`. These files remain for reference but should not be modified or relied upon.

## Key patterns in `src/App.vue`

- All player state is managed via Vue `ref()` in a single `<script setup>` block (no Pinia/store — keep it this way unless state complexity grows significantly)
- Two hidden media elements coexist: `<video ref="videoPlayer">` and `<audio ref="audioPlayer">`. Only one is active at a time, switched by `isVideo` ref
- `getActiveMedia()` returns whichever element is currently in use
- Media files are loaded via `file://` protocol URLs
- `playedHistory` tracks the last 50 played items (displayed in the offcanvas drawer)
- **VLC-style controls**: auto-hiding overlay (2.5s idle timer), `controlsVisible` ref, `wakeControls()`/`startHideTimer()`/`resetHideTimer()`
- **Playlist**: Bootstrap offcanvas (`bootstrap.Offcanvas`) slides from right, toggled via `openPlaylist()`
- **Theme**: dark/light via `data-bs-theme` attribute on root div, toggled from native menu → `currentTheme` ref
- **Icons**: Tabler Icons used as Vue components (`IconPlayerPlayFilled`, `IconVolume`, etc.) imported from `@tabler/icons-vue`
- **Toast**: Bootstrap toast for error messages, initialized in `onMounted`
- Drag-and-drop uses a counter (`dragCounter`) to handle nested drag enter/leave events correctly
- Keyboard shortcuts are handled on `document.keydown` (skip if target is `INPUT`)
- Menu events from the main process are subscribed via `window.electronAPI.onMenuAction()`
- Progress bar color is hardcoded: `#39ff14` (green stabilo)

## Build output

- `dist-app/` — Vite build output (renderer), checked into source control and included in packaged app
- `dist/` — electron-builder output (AppImage, .deb, .exe, .dmg)

In `vite.config.js`, the build splits `vue` into a separate manual chunk for caching. The Vite dev server runs on port 5173 with `strictPort: true`. `@tabler/icons-vue` tree-shakes automatically — only imported icons are bundled (6,220 modules at build time, ~110 KB JS output).
