const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const isDev = !!process.env.VITE_DEV_SERVER_URL;

// Shared constants — single source of truth for supported formats
const MEDIA_EXTENSIONS = {
  video: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'm4v'],
  audio: ['mp3', 'flac', 'ogg', 'wav', 'aac', 'm4a', 'opus']
};

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
const PDF_EXTENSIONS = ['pdf'];

const ALL_EXTENSIONS = [...MEDIA_EXTENSIONS.video, ...MEDIA_EXTENSIONS.audio];
const ALL_SCAN_EXTENSIONS = [...ALL_EXTENSIONS, ...IMAGE_EXTENSIONS, ...PDF_EXTENSIONS];
const ALL_SCAN_EXTENSIONS_DOT = ALL_SCAN_EXTENSIONS.map(ext => `.${ext}`);

const FILE_FILTERS = [
  { name: 'Media & Images', extensions: [...ALL_EXTENSIONS, ...IMAGE_EXTENSIONS, ...PDF_EXTENSIONS] },
  { name: 'Video Files', extensions: MEDIA_EXTENSIONS.video },
  { name: 'Audio Files', extensions: MEDIA_EXTENSIONS.audio },
  { name: 'Image Files', extensions: IMAGE_EXTENSIONS },
  { name: 'All Files', extensions: ['*'] }
];

let mainWindow;

// ── Helpers ──────────────────────────────────────────────────────────

function sendToRenderer(channel, ...args) {
  if (mainWindow) {
    mainWindow.webContents.send(channel, ...args);
  }
}

function sortAlphabetically(filePaths) {
  filePaths.sort((a, b) => {
    const nameA = path.basename(a).toLowerCase();
    const nameB = path.basename(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

function scanDir(dir) {
  let files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(scanDir(fullPath));
      } else if (ALL_SCAN_EXTENSIONS_DOT.includes(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  } catch (e) { /* skip permission errors */ }
  return files;
}

// ── File dialog helpers (shared by menu & IPC) ───────────────────────

async function pickFiles() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Media File',
    filters: FILE_FILTERS,
    properties: ['openFile', 'multiSelections']
  });
  if (result.canceled) return [];
  sortAlphabetically(result.filePaths);
  return result.filePaths;
}

async function pickFolder() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Folder with Media',
    properties: ['openDirectory']
  });
  if (result.canceled) return [];
  const files = scanDir(result.filePaths[0]);
  sortAlphabetically(files);
  return files;
}

// ── Menu actions ─────────────────────────────────────────────────────

async function menuOpenFile() {
  const files = await pickFiles();
  if (files.length > 0) sendToRenderer('files-opened', files);
}

async function menuOpenFolder() {
  const files = await pickFolder();
  if (files.length > 0) sendToRenderer('files-opened', files);
}

// ── Application menu ─────────────────────────────────────────────────

function createCustomMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: menuOpenFile
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: menuOpenFolder
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Playback',
      submenu: [
        { label: 'Play/Pause', accelerator: 'Space', click: () => sendToRenderer('playback-toggle') },
        { label: 'Stop', accelerator: 'CmdOrCtrl+.', click: () => sendToRenderer('playback-stop') },
        { label: 'Next', accelerator: 'CmdOrCtrl+Right', click: () => sendToRenderer('playlist-next') },
        { label: 'Previous', accelerator: 'CmdOrCtrl+Left', click: () => sendToRenderer('playlist-prev') }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Dark',
              type: 'radio',
              checked: true,
              click: () => sendToRenderer('theme-changed', 'dark')
            },
            {
              label: 'Light',
              type: 'radio',
              click: () => sendToRenderer('theme-changed', 'light')
            }
          ]
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

// ── IPC handlers (called by renderer via electronAPI) ────────────────

ipcMain.handle('dialog:openFile', pickFiles);
ipcMain.handle('dialog:openFolder', pickFolder);

ipcMain.handle('app:getPath', (event, name) => {
  return app.getPath(name);
});

ipcMain.handle('fs:fileExists', (event, filePath) => {
  return fs.existsSync(filePath);
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
});

// ── Window creation ──────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'VPlayer',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist-app', 'index.html'));
  }

  createCustomMenu();
}

// ── App lifecycle ────────────────────────────────────────────────────

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
