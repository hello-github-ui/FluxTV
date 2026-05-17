"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * 存储相关 API
   * 用于在本地保存用户配置和播放历史
   */
  /**
   * 获取存储的值
   * @param {string} key - 键名
   * @returns {Promise<any>} - 存储的值
   */
  storeGet: (key) => ipcRenderer.invoke("store-get", key),
  /**
   * 设置存储的值
   * @param {string} key - 键名
   * @param {any} value - 要存储的值
   * @returns {Promise<boolean>} - 是否成功
   */
  storeSet: (key, value) => ipcRenderer.invoke("store-set", key, value),
  /**
   * 删除存储的值
   * @param {string} key - 键名
   * @returns {Promise<boolean>} - 是否成功
   */
  storeDelete: (key) => ipcRenderer.invoke("store-delete", key),
  /**
   * 应用相关 API
   */
  /**
   * 获取应用版本
   * @returns {Promise<string>} - 版本号
   */
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  /**
   * 获取当前平台
   * @returns {Promise<string>} - win32/darwin/linux
   */
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  /**
   * 获取日志文件路径
   * @returns {Promise<string>} - 日志目录路径
   */
  getLogPath: () => ipcRenderer.invoke("get-log-path"),
  /**
   * 显示文件打开对话框
   * @param {Object} options - 对话框选项
   * @returns {Promise<Object>} - 对话框结果
   */
  showOpenDialog: (options) => ipcRenderer.invoke("show-open-dialog", options),
  /**
   * 窗口相关 API
   */
  /**
   * 最小化到系统托盘
   * @returns {Promise<boolean>}
   */
  minimizeToTray: () => ipcRenderer.invoke("minimize-to-tray"),
  /**
   * 退出应用
   * @returns {Promise<boolean>}
   */
  quitApp: () => ipcRenderer.invoke("quit-app"),
  /**
   * 事件监听 API
   * 用于主进程向渲染进程发送消息
   */
  /**
   * 监听打开文件事件
   * @param {Function} callback - 回调函数
   */
  onOpenFile: (callback) => {
    ipcRenderer.on("open-file", (event, filePath) => callback(filePath));
  },
  /**
   * 监听打开设置事件
   * @param {Function} callback - 回调函数
   */
  onOpenSettings: (callback) => {
    ipcRenderer.on("open-settings", () => callback());
  },
  /**
   * 监听播放/暂停事件
   * @param {Function} callback - 回调函数
   */
  onTogglePlayback: (callback) => {
    ipcRenderer.on("toggle-playback", () => callback());
  },
  /**
   * 监听停止播放事件
   * @param {Function} callback - 回调函数
   */
  onStopPlayback: (callback) => {
    ipcRenderer.on("stop-playback", () => callback());
  },
  /**
   * 监听音量调节事件
   * @param {Function} callback - 回调函数
   */
  onVolumeUp: (callback) => {
    ipcRenderer.on("volume-up", () => callback());
  },
  onVolumeDown: (callback) => {
    ipcRenderer.on("volume-down", () => callback());
  },
  /**
   * 监听静音切换事件
   * @param {Function} callback - 回调函数
   */
  onToggleMute: (callback) => {
    ipcRenderer.on("toggle-mute", () => callback());
  },
  /**
   * 监听频道切换事件
   * @param {Function} callback - 回调函数
   */
  onPrevChannel: (callback) => {
    ipcRenderer.on("prev-channel", () => callback());
  },
  onNextChannel: (callback) => {
    ipcRenderer.on("next-channel", () => callback());
  },
  /**
   * 监听收藏切换事件
   * @param {Function} callback - 回调函数
   */
  onToggleFavorite: (callback) => {
    ipcRenderer.on("toggle-favorite", () => callback());
  },
  /**
   * 移除事件监听
   * @param {string} channel - 频道名称
   */
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
console.log("FluxTV preload script loaded");
