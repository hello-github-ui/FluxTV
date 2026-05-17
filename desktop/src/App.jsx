/**
 * FluxTV 主应用组件
 *
 * 功能：
 * - 路由管理
 * - 全局布局
 * - 状态初始化
 */

import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from './components/Layout';
import Home from './pages/Home';
import Player from './pages/Player';
import { useStore } from './store/store';

/**
 * 主题配置
 */
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#1a1a2e',
    colorBgElevated: '#16213e',
    colorText: '#ffffff',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

/**
 * 全局样式
 */
import './index.css';

/**
 * 主应用组件
 */
function App() {
  const { loadChannels, loadFavorites, loadSettings } = useStore();

  /**
   * 应用启动时初始化数据
   */
  useEffect(() => {
    const initApp = async () => {
      try {
        await loadSettings();
        await loadChannels();
        await loadFavorites();
      } catch (error) {
        console.error('初始化应用失败:', error);
      }
    };

    initApp();

    /**
     * 注册 Electron IPC 事件监听
     */
    if (window.electronAPI) {
      window.electronAPI.onOpenSettings(() => {
        window.location.hash = '#/settings';
      });
    }
  }, []);

  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <AntApp>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/player/:channelId?" element={<Player />} />
          </Routes>
        </AppLayout>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
