/**
 * FluxTV 状态管理
 *
 * 使用 Zustand 进行状态管理
 * 包含：
 * - 频道列表管理
 * - 收藏管理
 * - 播放状态管理
 * - 设置管理
 */

import { create } from 'zustand';

/**
 * 默认的直播源 API 地址
 * 如果你部署了自己的 Cloudflare Worker，可以修改这个地址
 */
const DEFAULT_API_URL = 'https://fluxtv-iptv-api.hello-cloudflare-blog.workers.dev';

/**
 * 频道分类映射
 */
const CATEGORY_MAP = {
  '央视': ['CCTV', '央视', '中央'],
  '卫视': ['卫视', '湖南卫视', '浙江卫视', '东方卫视', '江苏卫视', '北京卫视', '安徽卫视', '广东卫视', '深圳卫视'],
  '地方': ['珠江', '南方', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安'],
  '体育': ['体育', 'NBA', '足球', 'CBA', '赛事', '高尔夫', '羽毛球'],
  '电影': ['电影', '影院', 'CCTV6', '好莱坞'],
  '综艺': ['综艺', '娱乐', '春晚', '晚会'],
  '新闻': ['新闻', '资讯', '国际'],
  '少儿': ['少儿', '卡通', '动漫', '宝宝', '儿童'],
  '音乐': ['音乐', 'MTV', '歌曲', 'KTV'],
};

/**
 * 根据频道名称自动分类
 * @param {string} name - 频道名称
 * @returns {string} - 分类名称
 */
function autoCategorize(name) {
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        return category;
      }
    }
  }
  return '其他';
}

/**
 * 解析 M3U 内容为频道列表
 * @param {string} content - M3U 文件内容
 * @returns {Array} - 频道列表
 */
function parseM3U(content) {
  const channels = [];
  const lines = content.split('\n');
  let currentInfo = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#EXTINF:')) {
      const info = trimmed.substring(8);

      const groupMatch = info.match(/group-title="([^"]*)"/);
      const logoMatch = info.match(/tvg-logo="([^"]*)"/);
      const nameMatch = info.match(/,(.+)$/);

      currentInfo = {
        group: groupMatch ? groupMatch[1] : autoCategorize(info),
        logo: logoMatch ? logoMatch[1] : '',
        name: nameMatch ? nameMatch[1].trim() : '',
      };
    } else if (trimmed && !trimmed.startsWith('#')) {
      currentInfo.url = trimmed;
      if (currentInfo.name && currentInfo.url) {
        channels.push({ ...currentInfo });
      }
      currentInfo = {};
    }
  }

  return channels;
}

/**
 * 主状态存储
 */
const useStore = create((set, get) => ({
  /**
   * 状态定义
   */

  /** 频道列表 */
  channels: [],
  channelsLoading: false,
  channelsError: null,

  /** 收藏列表 */
  favorites: [],

  /** 播放状态 */
  currentChannel: null,
  isPlaying: false,
  volume: 1.0,
  isMuted: false,

  /** 设置 */
  settings: {
    apiUrl: DEFAULT_API_URL,
    autoUpdate: true,
    minimizeToTray: true,
    showNotifications: true,
  },

  /** 分类后的频道 */
  categorizedChannels: {},

  /** 当前选中的分类 */
  currentCategory: '全部',

  /**
   * 操作方法
   */

  /**
   * 从 API 获取频道列表
   */
  loadChannels: async () => {
    const { settings } = get();
    set({ channelsLoading: true, channelsError: null });

    try {
      let channels = [];

      if (window.electronAPI) {
        const savedChannels = await window.electronAPI.storeGet('channels');
        if (savedChannels && savedChannels.length > 0) {
          channels = savedChannels;
        }
      }

      if (channels.length === 0) {
        const response = await fetch(`${settings.apiUrl}/api/live`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        channels = data.channels || [];

        if (window.electronAPI) {
          await window.electronAPI.storeSet('channels', channels);
        }
      }

      const categorized = {};
      for (const channel of channels) {
        const category = channel.group || autoCategorize(channel.name);
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(channel);
      }

      set({ channels, categorizedChannels: categorized, channelsLoading: false });
    } catch (error) {
      console.error('加载频道失败:', error);
      set({ channelsError: error.message, channelsLoading: false });
    }
  },

  /**
   * 刷新频道列表
   */
  refreshChannels: async () => {
    const { settings } = get();

    try {
      const response = await fetch(`${settings.apiUrl}/api/live`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const channels = data.channels || [];

      if (window.electronAPI) {
        await window.electronAPI.storeSet('channels', channels);
      }

      const categorized = {};
      for (const channel of channels) {
        const category = channel.group || autoCategorize(channel.name);
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(channel);
      }

      set({ channels, categorizedChannels: categorized });
    } catch (error) {
      console.error('刷新频道失败:', error);
      set({ channelsError: error.message });
    }
  },

  /**
   * 从本地文件加载频道
   * @param {string} content - 文件内容
   */
  loadChannelsFromFile: (content) => {
    const channels = parseM3U(content);

    const categorized = {};
    for (const channel of channels) {
      const category = channel.group || autoCategorize(channel.name);
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(channel);
    }

    set({ channels, categorizedChannels: categorized });

    if (window.electronAPI) {
      window.electronAPI.storeSet('channels', channels);
    }
  },

  /**
   * 加载收藏列表
   */
  loadFavorites: async () => {
    if (window.electronAPI) {
      const favorites = await window.electronAPI.storeGet('favoriteChannels');
      set({ favorites: favorites || [] });
    }
  },

  /**
   * 加载设置
   */
  loadSettings: async () => {
    if (window.electronAPI) {
      const settings = await window.electronAPI.storeGet('appSettings');
      if (settings) {
        set({ settings: { ...get().settings, ...settings } });
      }
      const volume = await window.electronAPI.storeGet('volume');
      if (volume !== undefined) {
        set({ volume });
      }
      const currentCategory = await window.electronAPI.storeGet('currentCategory');
      if (currentCategory) {
        set({ currentCategory });
      }
    }
  },

  /**
   * 保存设置
   */
  saveSettings: async (newSettings) => {
    const settings = { ...get().settings, ...newSettings };
    set({ settings });

    if (window.electronAPI) {
      await window.electronAPI.storeSet('appSettings', settings);
    }
  },

  /**
   * 切换收藏
   * @param {Object} channel - 频道对象
   */
  toggleFavorite: async (channel) => {
    const { favorites } = get();
    const index = favorites.findIndex((f) => f.name === channel.name);

    let newFavorites;
    if (index >= 0) {
      newFavorites = favorites.filter((_, i) => i !== index);
    } else {
      newFavorites = [...favorites, channel];
    }

    set({ favorites: newFavorites });

    if (window.electronAPI) {
      await window.electronAPI.storeSet('favoriteChannels', newFavorites);
    }
  },

  /**
   * 检查频道是否已收藏
   * @param {Object} channel - 频道对象
   * @returns {boolean}
   */
  isFavorite: (channel) => {
    return get().favorites.some((f) => f.name === channel.name);
  },

  /**
   * 设置当前播放频道
   * @param {Object|null} channel - 频道对象
   */
  setCurrentChannel: (channel) => {
    set({ currentChannel: channel });

    if (window.electronAPI && channel) {
      window.electronAPI.storeSet('lastChannel', channel);
    }
  },

  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume: async (volume) => {
    set({ volume, isMuted: volume === 0 });

    if (window.electronAPI) {
      await window.electronAPI.storeSet('volume', volume);
    }
  },

  /**
   * 切换静音
   */
  toggleMute: () => {
    const { isMuted } = get();
    set({ isMuted: !isMuted });
  },

  /**
   * 设置播放状态
   * @param {boolean} isPlaying - 是否正在播放
   */
  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  /**
   * 获取上一个频道
   * @returns {Object|null}
   */
  getPrevChannel: () => {
    const { channels, currentChannel } = get();
    if (!currentChannel || channels.length === 0) return null;

    const currentIndex = channels.findIndex((c) => c.name === currentChannel.name);
    if (currentIndex <= 0) return channels[channels.length - 1];
    return channels[currentIndex - 1];
  },

  /**
   * 获取下一个频道
   * @returns {Object|null}
   */
  getNextChannel: () => {
    const { channels, currentChannel } = get();
    if (!currentChannel || channels.length === 0) return null;

    const currentIndex = channels.findIndex((c) => c.name === currentChannel.name);
    if (currentIndex >= channels.length - 1) return channels[0];
    return channels[currentIndex + 1];
  },

  /**
   * 设置当前分类
   * @param {string} category - 分类名称/**
   * 设置当前分类
   */
  setCurrentCategory: (category) => {
    set({ currentCategory: category });
    if (window.electronAPI) {
      window.electronAPI.storeSet('currentCategory', category).catch(() => {});
    }
  },}));

export { useStore, autoCategorize, parseM3U };
export default useStore;
