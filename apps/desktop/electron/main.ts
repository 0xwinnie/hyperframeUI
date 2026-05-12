import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { stopCompositionWatcher } from './composition-watcher';
import { registerAgentIpc } from './ipc/agent';
import { registerMediaIpc, stopMediaWatcher } from './ipc/media';
import { registerOpsIpc } from './ipc/ops';
import { getActiveServerUrl, registerPreviewIpc, stopActivePreview } from './ipc/preview';
import { registerProjectIpc } from './ipc/project';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In dev, vite-plugin-electron sets VITE_DEV_SERVER_URL to the Vite URL.
// In a packaged build the renderer lives next to main.js under dist-electron/.
const DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const RENDERER_DIST = path.join(__dirname, '..', 'dist');

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'HyperframeUI',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1c1d22',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // Open <a target="_blank"> links in the user's default browser, not in-app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  // Forward renderer console output to main stdout for easier debugging
  // during Phase 0. We can lower the verbosity in P1.
  mainWindow.webContents.on('console-message', (_event, level, message, line, source) => {
    const tag = ['log', 'warn', 'error'][level] ?? 'log';
    console.log(`[renderer:${tag}] ${message} (${source}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (_event, code, description) => {
    console.error('[renderer] did-fail-load', code, description);
  });

  if (DEV_SERVER_URL) {
    void mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

function registerEnvIpc(): void {
  // The renderer process does not reliably inherit our launch env, so we
  // expose a tiny IPC for it to pull the values it needs from the main
  // process (which always inherits the launching shell's env).
  ipcMain.handle('hfui:env:demoProjectPath', () => process.env['HFUI_DEMO_PROJECT'] ?? null);
}

app.whenReady().then(() => {
  console.log(
    '[hfui] main ready. HFUI_DEMO_PROJECT=',
    process.env['HFUI_DEMO_PROJECT'] ?? '(unset)',
  );
  registerEnvIpc();
  registerProjectIpc();
  registerPreviewIpc();
  registerMediaIpc(getActiveServerUrl);
  registerOpsIpc();
  registerAgentIpc();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async (event) => {
  event.preventDefault();
  await stopMediaWatcher();
  await stopCompositionWatcher();
  await stopActivePreview();
  app.exit(0);
});
