/**
 * FluxTV Electron 主进程入口
 *
 * 功能说明：
 * - 管理应用窗口生命周期
 * - 处理系统级事件（菜单、托盘、快捷键）
 * - 与渲染进程通信
 * - 集成 electron-store 进行本地数据存储
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, globalShortcut, nativeImage, dialog, shell } = require('electron');
const path = require('path');
const log = require('electron-log');
const Store = require('electron-store');

/**
 * 日志配置
 * 捕获未处理的异常和警告
 */
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('FluxTV 应用启动...');

/**
 * 初始化 electron-store
 * 用于存储用户配置和播放历史
 */
const store = new Store({
  name: 'fluxtv-config',
  defaults: {
    windowBounds: { width: 1280, height: 800 },
    volume: 1.0,
    lastChannel: null,
    favoriteChannels: [],
    playbackHistory: [],
    appSettings: {
      autoUpdate: true,
      minimizeToTray: true,
      showNotifications: true,
    },
  },
});

/**
 * 全局窗口变量
 */
let mainWindow = null;

/**
 * 系统托盘变量
 */
let tray = null;

/**
 * 是否为开发模式
 */
const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

/**
 * 获取资源路径
 * 开发模式返回 Vite 开发服务器地址
 * 生产模式返回打包后的静态文件路径
 */
function getResourcePath() {
  if (isDev) {
    return 'http://localhost:5173';
  }
  return `file://${path.join(__dirname, '../dist/index.html')}`;
}

/**
 * 创建主窗口
 */
function createWindow() {
  const { width, height } = store.get('windowBounds');

  /**
   * 创建浏览器窗口
   */
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 960,
    minHeight: 600,
    title: 'FluxTV',
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false,
    backgroundColor: '#1a1a2e',
  });

  /**
   * 窗口准备就绪后显示
   * 防止白屏闪烁
   */
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('主窗口已显示');
  });

  /**
   * 加载页面
   */
  mainWindow.loadURL(getResourcePath());

  /**
   * 开发模式下打开开发者工具
   */
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  /**
   * 窗口关闭时保存尺寸
   */
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowBounds', { width, height });
  });

  /**
   * 窗口关闭事件处理
   * 根据设置决定是否最小化到托盘
   */
  mainWindow.on('close', (event) => {
    const settings = store.get('appSettings');
    if (settings.minimizeToTray && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      log.info('窗口已最小化到托盘');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    log.info('主窗口已关闭');
  });

  log.info('主窗口创建完成');
}

/**
 * 创建系统托盘
 */
function createTray() {
  const iconPath = path.join(__dirname, '../build/icon.png');
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
      label: '显示 FluxTV',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      },
    },
    {
      label: '隐藏 FluxTV',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('FluxTV - IPTV 播放器');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  log.info('系统托盘创建完成');
}

/**
 * 创建应用菜单
 */
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开直播源文件...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'M3U Files', extensions: ['m3u', 'm3u8'] },
                { name: 'All Files', extensions: ['*'] },
              ],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('open-file', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        {
          label: '设置',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('open-settings');
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: '播放',
      submenu: [
        {
          label: '播放/暂停',
          accelerator: 'Space',
          click: () => {
            mainWindow.webContents.send('toggle-playback');
          },
        },
        {
          label: '停止',
          accelerator: 'CmdOrCtrl+.',
          click: () => {
            mainWindow.webContents.send('stop-playback');
          },
        },
        { type: 'separator' },
        {
          label: '增大音量',
          accelerator: 'CmdOrCtrl+Up',
          click: () => {
            mainWindow.webContents.send('volume-up');
          },
        },
        {
          label: '减小音量',
          accelerator: 'CmdOrCtrl+Down',
          click: () => {
            mainWindow.webContents.send('volume-down');
          },
        },
        {
          label: '静音',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.webContents.send('toggle-mute');
          },
        },
        { type: 'separator' },
        {
          label: '全屏',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
      ],
    },
    {
      label: '频道',
      submenu: [
        {
          label: '上一个频道',
          accelerator: 'PageUp',
          click: () => {
            mainWindow.webContents.send('prev-channel');
          },
        },
        {
          label: '下一个频道',
          accelerator: 'PageDown',
          click: () => {
            mainWindow.webContents.send('next-channel');
          },
        },
        { type: 'separator' },
        {
          label: '收藏频道',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('toggle-favorite');
          },
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '重新加载',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: '开发者工具',
          accelerator: 'Alt+CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
        { type: 'separator' },
        {
          label: '缩放',
          submenu: [
            { label: '放大', accelerator: 'CmdOrCtrl+Plus', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
            { label: '缩小', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
            { label: '重置缩放', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.setZoomLevel(0) },
          ],
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 FluxTV',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 FluxTV',
              message: 'FluxTV - IPTV 桌面播放器',
              detail: '版本: 1.0.0\n一个简洁高效的 IPTV 直播播放应用。',
            });
          },
        },
        {
          label: '打开日志文件夹',
          click: () => {
            shell.openPath(path.dirname(log.transports.file.getFile().path));
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  log.info('应用菜单创建完成');
}

/**
 * 注册全局快捷键
 */
function registerGlobalShortcuts() {
  /**
   * 播放/暂停快捷键
   */
  globalShortcut.register('MediaPlayPause', () => {
    mainWindow.webContents.send('toggle-playback');
  });

  /**
   * 停止快捷键
   */
  globalShortcut.register('MediaStop', () => {
    mainWindow.webContents.send('stop-playback');
  });

  /**
   * 上一频道快捷键
   */
  globalShortcut.register('MediaPreviousTrack', () => {
    mainWindow.webContents.send('prev-channel');
  });

  /**
   * 下一频道快捷键
   */
  globalShortcut.register('MediaNextTrack', () => {
    mainWindow.webContents.send('next-channel');
  });

  log.info('全局快捷键注册完成');
}

/**
 * 设置 IPC 通信处理
 */
function setupIPC() {
  /**
   * 获取存储的数据
   */
  ipcMain.handle('store-get', (event, key) => {
    return store.get(key);
  });

  /**
   * 设置存储的数据
   */
  ipcMain.handle('store-set', (event, key, value) => {
    store.set(key, value);
    return true;
  });

  /**
   * 删除存储的数据
   */
  ipcMain.handle('store-delete', (event, key) => {
    store.delete(key);
    return true;
  });

  /**
   * 获取应用版本
   */
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  /**
   * 获取平台信息
   */
  ipcMain.handle('get-platform', () => {
    return process.platform;
  });

  /**
   * 显示文件对话框
   */
  ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  /**
   * 获取日志路径
   */
  ipcMain.handle('get-log-path', () => {
    return path.dirname(log.transports.file.getFile().path);
  });

  /**
   * 最小化到托盘
   */
  ipcMain.handle('minimize-to-tray', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
    return true;
  });

  /**
   * 退出应用
   */
  ipcMain.handle('quit-app', () => {
    app.isQuitting = true;
    app.quit();
  });

  log.info('IPC 通信设置完成');
}

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (error) => {
  log.error('未捕获的异常:', error);
  dialog.showErrorBox('错误', `发生了一个错误: ${error.message}`);
});

/**
 * 处理未处理的 Promise 拒绝
 */
process.on('unhandledRejection', (reason, promise) => {
  log.error('未处理的 Promise 拒绝:', reason);
});

/**
 * 应用准备就绪
 */
app.whenReady().then(() => {
  log.info('应用准备就绪');
  createWindow();
  createTray();
  createMenu();
  registerGlobalShortcuts();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

/**
 * 所有窗口关闭事件
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * 应用退出前清理
 */
app.on('before-quit', () => {
  app.isQuitting = true;
  globalShortcut.unregisterAll();
  log.info('应用正在退出');
});

/**
 * 应用退出事件
 */
app.on('quit', () => {
  log.info('应用已退出');
});
