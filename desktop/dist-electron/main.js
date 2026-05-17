"use strict";
const { app, BrowserWindow, ipcMain, Menu, Tray, globalShortcut, nativeImage, dialog, shell } = require("electron");
const path = require("path");
const log = require("electron-log");
const Store = require("electron-store");
log.transports.file.level = "info";
log.transports.console.level = "debug";
log.info("FluxTV 应用启动...");
const store = new Store({
  name: "fluxtv-config",
  defaults: {
    windowBounds: { width: 1280, height: 800 },
    volume: 1,
    lastChannel: null,
    favoriteChannels: [],
    playbackHistory: [],
    appSettings: {
      autoUpdate: true,
      minimizeToTray: true,
      showNotifications: true
    }
  }
});
let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV !== "production" || !app.isPackaged;
function getResourcePath() {
  if (isDev) {
    return "http://localhost:5173";
  }
  return `file://${path.join(__dirname, "../dist/index.html")}`;
}
function createWindow() {
  const { width, height } = store.get("windowBounds");
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 960,
    minHeight: 600,
    title: "FluxTV",
    icon: path.join(__dirname, "../build/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "dist-electron/preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: false,
    backgroundColor: "#1a1a2e"
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    log.info("主窗口已显示");
  });
  mainWindow.loadURL(getResourcePath());
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("resize", () => {
    const { width: width2, height: height2 } = mainWindow.getBounds();
    store.set("windowBounds", { width: width2, height: height2 });
  });
  mainWindow.on("close", (event) => {
    const settings = store.get("appSettings");
    if (settings.minimizeToTray && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      log.info("窗口已最小化到托盘");
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
    log.info("主窗口已关闭");
  });
  log.info("主窗口创建完成");
}
function createTray() {
  const iconPath = path.join(__dirname, "../build/icon.png");
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示 FluxTV",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: "隐藏 FluxTV",
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip("FluxTV - IPTV 播放器");
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
  log.info("系统托盘创建完成");
}
function createMenu() {
  const template = [
    {
      label: "文件",
      submenu: [
        {
          label: "打开直播源文件...",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openFile"],
              filters: [
                { name: "M3U Files", extensions: ["m3u", "m3u8"] },
                { name: "All Files", extensions: ["*"] }
              ]
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send("open-file", result.filePaths[0]);
            }
          }
        },
        { type: "separator" },
        {
          label: "设置",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            mainWindow.webContents.send("open-settings");
          }
        },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "播放",
      submenu: [
        {
          label: "播放/暂停",
          accelerator: "Space",
          click: () => {
            mainWindow.webContents.send("toggle-playback");
          }
        },
        {
          label: "停止",
          accelerator: "CmdOrCtrl+.",
          click: () => {
            mainWindow.webContents.send("stop-playback");
          }
        },
        { type: "separator" },
        {
          label: "增大音量",
          accelerator: "CmdOrCtrl+Up",
          click: () => {
            mainWindow.webContents.send("volume-up");
          }
        },
        {
          label: "减小音量",
          accelerator: "CmdOrCtrl+Down",
          click: () => {
            mainWindow.webContents.send("volume-down");
          }
        },
        {
          label: "静音",
          accelerator: "CmdOrCtrl+M",
          click: () => {
            mainWindow.webContents.send("toggle-mute");
          }
        },
        { type: "separator" },
        {
          label: "全屏",
          accelerator: "F11",
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }
      ]
    },
    {
      label: "频道",
      submenu: [
        {
          label: "上一个频道",
          accelerator: "PageUp",
          click: () => {
            mainWindow.webContents.send("prev-channel");
          }
        },
        {
          label: "下一个频道",
          accelerator: "PageDown",
          click: () => {
            mainWindow.webContents.send("next-channel");
          }
        },
        { type: "separator" },
        {
          label: "收藏频道",
          accelerator: "CmdOrCtrl+D",
          click: () => {
            mainWindow.webContents.send("toggle-favorite");
          }
        }
      ]
    },
    {
      label: "视图",
      submenu: [
        {
          label: "重新加载",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: "开发者工具",
          accelerator: "Alt+CmdOrCtrl+I",
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: "separator" },
        {
          label: "缩放",
          submenu: [
            { label: "放大", accelerator: "CmdOrCtrl+Plus", click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
            { label: "缩小", accelerator: "CmdOrCtrl+-", click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
            { label: "重置缩放", accelerator: "CmdOrCtrl+0", click: () => mainWindow.webContents.setZoomLevel(0) }
          ]
        },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "关于 FluxTV",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "关于 FluxTV",
              message: "FluxTV - IPTV 桌面播放器",
              detail: "版本: 1.0.0\n一个简洁高效的 IPTV 直播播放应用。"
            });
          }
        },
        {
          label: "打开日志文件夹",
          click: () => {
            shell.openPath(path.dirname(log.transports.file.getFile().path));
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  log.info("应用菜单创建完成");
}
function registerGlobalShortcuts() {
  globalShortcut.register("MediaPlayPause", () => {
    mainWindow.webContents.send("toggle-playback");
  });
  globalShortcut.register("MediaStop", () => {
    mainWindow.webContents.send("stop-playback");
  });
  globalShortcut.register("MediaPreviousTrack", () => {
    mainWindow.webContents.send("prev-channel");
  });
  globalShortcut.register("MediaNextTrack", () => {
    mainWindow.webContents.send("next-channel");
  });
  log.info("全局快捷键注册完成");
}
function setupIPC() {
  ipcMain.handle("store-get", (event, key) => {
    return store.get(key);
  });
  ipcMain.handle("store-set", (event, key, value) => {
    store.set(key, value);
    return true;
  });
  ipcMain.handle("store-delete", (event, key) => {
    store.delete(key);
    return true;
  });
  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });
  ipcMain.handle("get-platform", () => {
    return process.platform;
  });
  ipcMain.handle("show-open-dialog", async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });
  ipcMain.handle("get-log-path", () => {
    return path.dirname(log.transports.file.getFile().path);
  });
  ipcMain.handle("minimize-to-tray", () => {
    if (mainWindow) {
      mainWindow.hide();
    }
    return true;
  });
  ipcMain.handle("quit-app", () => {
    app.isQuitting = true;
    app.quit();
  });
  log.info("IPC 通信设置完成");
}
process.on("uncaughtException", (error) => {
  log.error("未捕获的异常:", error);
  dialog.showErrorBox("错误", `发生了一个错误: ${error.message}`);
});
process.on("unhandledRejection", (reason, promise) => {
  log.error("未处理的 Promise 拒绝:", reason);
});
app.whenReady().then(() => {
  log.info("应用准备就绪");
  createWindow();
  createTray();
  createMenu();
  registerGlobalShortcuts();
  setupIPC();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", () => {
  app.isQuitting = true;
  globalShortcut.unregisterAll();
  log.info("应用正在退出");
});
app.on("quit", () => {
  log.info("应用已退出");
});
