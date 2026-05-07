/**
 * Zustand状态管理
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:10:00
 */

import { create } from 'zustand';

const useStore = create((set, get) => ({
  // 用户状态
  user: null,
  token: localStorage.getItem('token') || null,
  
  // 频道数据
  channels: [],
  categories: [],
  currentChannel: null,
  
  // 播放状态
  isPlaying: false,
  volume: 80,
  
  // 设置用户
  setUser: (user) => set({ user }),
  
  // 设置Token
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  
  // 清除用户
  clearUser: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  
  // 设置频道列表
  setChannels: (channels) => set({ channels }),
  
  // 设置分类列表
  setCategories: (categories) => set({ categories }),
  
  // 设置当前播放频道
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  
  // 设置播放状态
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  // 设置音量
  setVolume: (volume) => set({ volume })
}));

export default useStore;