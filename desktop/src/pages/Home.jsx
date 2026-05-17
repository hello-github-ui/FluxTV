/**
 * FluxTV 首页组件
 *
 * 功能：
 * - 频道分类展示
 * - 频道搜索
 * - 收藏频道快速访问
 * - 频道网格布局
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Tabs, Badge, Spin, Empty, Button, message } from 'antd';
import { SearchOutlined, HeartOutlined, AppstoreOutlined } from '@ant-design/icons';
import ChannelCard from '../components/ChannelCard';
import { useStore } from '../store/store';

const { Search } = Input;

/**
 * 首页组件
 */
function Home() {
  const navigate = useNavigate();
  const {
    channels,
    categorizedChannels,
    favorites,
    channelsLoading,
    channelsError,
    loadChannelsFromFile,
    refreshChannels,
    currentCategory,
    setCurrentCategory,
  } = useStore();

  const [searchText, setSearchText] = useState('');

  /**
   * 处理标签页切换
   */
  const handleTabChange = (key) => {
    setCurrentCategory(key);
  };

  /**
   * 过滤频道
   */
  const filteredChannels = useMemo(() => {
    let result = channels;

    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(
        (channel) =>
          channel.name.toLowerCase().includes(lowerSearch) ||
          (channel.group && channel.group.toLowerCase().includes(lowerSearch))
      );
    }

    if (currentCategory === 'favorites') {
      const favoriteNames = favorites.map((f) => f.name);
      result = result.filter((channel) => favoriteNames.includes(channel.name));
    }

    return result;
  }, [channels, searchText, currentCategory, favorites]);

  /**
   * 获取当前显示的频道
   */
  const getDisplayChannels = () => {
    if (currentCategory === 'all' || currentCategory === 'favorites') {
      return filteredChannels;
    }
    
    const categoryChannels = categorizedChannels[currentCategory] || [];
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      return categoryChannels.filter(
        (channel) =>
          channel.name.toLowerCase().includes(lowerSearch) ||
          (channel.group && channel.group.toLowerCase().includes(lowerSearch))
      );
    }
    return categoryChannels;
  };

  /**
   * 渲染分类标签页
   */
  const renderCategoryTabs = () => {
    const categories = Object.keys(categorizedChannels);

    const tabs = [
      {
        key: 'all',
        label: (
          <span>
            全部
            <Badge
              count={channels.length}
              style={{ marginLeft: 8, backgroundColor: '#1890ff' }}
            />
          </span>
        ),
      },
      {
        key: 'favorites',
        label: (
          <span>
            <HeartOutlined />
            收藏
            <Badge
              count={favorites.length}
              style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }}
            />
          </span>
        ),
      },
    ];

    categories.forEach((category) => {
      tabs.push({
        key: category,
        label: (
          <span>
            {category}
            <Badge
              count={categorizedChannels[category].length}
              style={{ marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.2)' }}
            />
          </span>
        ),
      });
    });

    return tabs;
  };

  /**
   * 加载状态
   */
  if (channelsLoading && channels.length === 0) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <span>正在加载频道...</span>
      </div>
    );
  }

  /**
   * 错误状态
   */
  if (channelsError && channels.length === 0) {
    return (
      <div className="empty-state">
        <AppstoreOutlined style={{ fontSize: 64, opacity: 0.3 }} />
        <h3>加载失败</h3>
        <p>{channelsError}</p>
        <Button type="primary" onClick={refreshChannels}>
          重试
        </Button>
      </div>
    );
  }

  const displayChannels = getDisplayChannels();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 搜索栏 */}
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <Search
          placeholder="搜索频道..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          size="large"
          style={{ width: '100%' }}
        />
      </div>

      {/* 分类标签页 */}
      <div style={{ flexShrink: 0, paddingTop: 8 }}>
        <Tabs
          activeKey={currentCategory}
          onChange={handleTabChange}
          tabBarStyle={{
            padding: '0 16px',
            background: '#1a1a2e',
            margin: 0,
          }}
          items={renderCategoryTabs()}
        />
      </div>

      {/* 频道列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {displayChannels.length === 0 ? (
          <Empty
            description={searchText ? '未找到匹配的频道' : '暂无频道'}
            style={{ marginTop: 50 }}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 16,
            }}
          >
            {displayChannels.map((channel, index) => (
              <ChannelCard key={`${channel.name}-${index}`} channel={channel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
