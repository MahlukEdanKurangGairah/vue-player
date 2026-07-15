# AGENTS.md

## Commands

```bash
bun install                # Bun is the ONLY package manager (bun.lock, bunx in scripts)
bun run dev                # Starts Vite + Electron (auto-sets VITE_DEV_SERVER_URL=http://localhost:5173)
bun run build              # Full build: Vite → electron-builder
bun run build:linux        # Linux AppImage + .deb
bun run build:win          # Windows NSIS
bun run build:mac          # macOS DMG
```

- `bun run dev` starts Vite in the background (`&`), then launches Electron after a 2s sleep. If Vite port 5173 is unavailable, the build will fail — port is `strictPort: true`.
- There are **no tests, no lint, no typecheck** in this project.

## Architecture

VPlayer is an Electron 28 desktop media player. Three processes:

1. **Main** (`main.js`) — `BrowserWindow`, native menu, file/folder dialogs, recursive folder scan, IPC handlers.
2. **Preload** (`preload.js`) — context bridge exposing `window.electronAPI` with whitelisted IPC channels.
3. **Renderer** (`src/`) — Vue 3 (Composition API, `<script setup>`) + Tabler CSS + Tabler Icons Vue. Single-file app: `src/main.js` → `src/App.vue`.

**Security (DO NOT WEAKEN):**
- `nodeIntegration: false`, `contextIsolation: true`
- Renderer only accesses APIs through `window.electronAPI` (preload bridge)
- IPC channels are whitelisted in both `preload.js` and `main.js`
- CSP is defined inline in `index.html`

## Build output

- `dist-app/` — Vite output (gitignored, but required for production; electron-builder packages `dist-app/**/*`)
- `dist/` — electron-builder output (gitignored)
- `vite.config.js` splits `vue` into a manual vendor chunk for caching

## State management

- All state is in `src/App.vue` via Vue `ref()` in a single `<script setup>`. No Pinia/store.
- Two hidden media elements coexist: `<video ref="videoPlayer">` and `<audio ref="audioPlayer">`. Use `getActiveMedia()` to get the active one. Only one plays at a time, switched by `isVideo` ref.
- Media files load via `file://` protocol URLs.

## Dependencies

- `@tabler/icons-vue` tree-shakes automatically — only imported icons are bundled
- `bootstrap` JS (tooltips, offcanvas, toast) is imported directly in `src/main.js` as a transitive dependency of `@tabler/core`. It is NOT a direct dependency in `package.json`.
- `electron-builder` config lives under `"build"` key in `package.json`

## Legacy code

`legacy/renderer.js` and `legacy/style.css` are the original vanilla-JS implementation. **Not used.** The active UI is entirely in `src/App.vue`.

## Additional instruction sources

- `CLAUDE.md` — guidance for Claude Code (this file is the OpenCode equivalent)
