/**
 * FluxTV 播放器页面组件
 *
 * 功能：
 * - 视频播放
 * - 频道信息展示
 * - 上下频道切换
 * - 频道列表侧边栏
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Drawer, List, Typography, Space, Badge, Spin, Empty } from 'antd';
import {
  ArrowLeftOutlined,
  MenuOutlined,
  LeftOutlined,
  RightOutlined,
  HeartOutlined,
  HeartFilled,
} from '@ant-design/icons';
import VideoPlayer from '../components/VideoPlayer';
import { useStore } from '../store/store';

const { Text, Title } = Typography;

/**
 * 播放器页面组件
 */
function Player() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const {
    channels,
    currentChannel,
    setCurrentChannel,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    toggleFavorite,
    isFavorite,
    getPrevChannel,
    getNextChannel,
    setIsPlaying,
  } = useStore();

  const [showChannelList, setShowChannelList] = useState(false);

  /**
   * 解码频道名称
   */
  const decodedChannelName = channelId ? decodeURIComponent(channelId) : null;

  /**
   * 查找当前频道
   */
  const channel = currentChannel ||
    channels.find((c) => c.name === decodedChannelName) ||
    channels[0];

  /**
   * 设置当前频道
   */
  useEffect(() => {
    if (channel && !currentChannel) {
      setCurrentChannel(channel);
    }
  }, [channel]);

  /**
   * 监听 Electron IPC 事件
   */
  useEffect(() => {
    if (!window.electronAPI) return;

    /**
     * 播放/暂停事件
     */
    window.electronAPI.onTogglePlayback(() => {
      setIsPlaying(false);
    });

    /**
     * 上一频道事件
     */
    window.electronAPI.onPrevChannel(() => {
      const prev = getPrevChannel();
      if (prev) {
        setCurrentChannel(prev);
        navigate(`/player/${encodeURIComponent(prev.name)}`);
      }
    });

    /**
     * 下一频道事件
     */
    window.electronAPI.onNextChannel(() => {
      const next = getNextChannel();
      if (next) {
        setCurrentChannel(next);
        navigate(`/player/${encodeURIComponent(next.name)}`);
      }
    });

    /**
     * 音量事件
     */
    window.electronAPI.onVolumeUp(() => {
      const newVolume = Math.min(1, volume + 0.1);
      setVolume(newVolume);
    });

    window.electronAPI.onVolumeDown(() => {
      const newVolume = Math.max(0, volume - 0.1);
      setVolume(newVolume);
    });

    window.electronAPI.onToggleMute(() => {
      toggleMute();
    });

    /**
     * 收藏事件
     */
    window.electronAPI.onToggleFavorite(() => {
      if (channel) {
        toggleFavorite(channel);
      }
    });

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('toggle-playback');
        window.electronAPI.removeAllListeners('prev-channel');
        window.electronAPI.removeAllListeners('next-channel');
        window.electronAPI.removeAllListeners('volume-up');
        window.electronAPI.removeAllListeners('volume-down');
        window.electronAPI.removeAllListeners('toggle-mute');
        window.electronAPI.removeAllListeners('toggle-favorite');
      }
    };
  }, [volume, channel]);

  /**
   * 处理频道选择
   */
  const handleChannelSelect = (selectedChannel) => {
    setCurrentChannel(selectedChannel);
    navigate(`/player/${encodeURIComponent(selectedChannel.name)}`);
    setShowChannelList(false);
  };

  /**
   * 渲染频道列表
   */
  const renderChannelList = () => (
    <List
      dataSource={channels}
      renderItem={(item) => (
        <List.Item
          onClick={() => handleChannelSelect(item)}
          style={{
            cursor: 'pointer',
            background: item.name === channel?.name ? 'rgba(24, 144, 255, 0.2)' : 'transparent',
            padding: '12px 16px',
          }}
        >
          <List.Item.Meta
            avatar={
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: item.logo
                    ? `url(${item.logo}) center/contain no-repeat`
                    : 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              >
                {!item.logo && item.name.charAt(0)}
              </div>
            }
            title={<Text style={{ color: '#fff' }}>{item.name}</Text>}
            description={
              item.group && (
                <Badge
                  count={item.group}
                  style={{
                    backgroundColor: 'rgba(24, 144, 255, 0.2)',
                    color: '#1890ff',
                    fontSize: 10,
                  }}
                />
              )
            }
          />
        </List.Item>
      )}
    />
  );

  /**
   * 无频道状态
   */
  if (!channel) {
    return (
      <div className="empty-state">
        <Empty description="请先选择频道" />
        <Button type="primary" onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 顶部栏 */}
      <div
        style={{
          padding: '8px 16px',
          background: 'linear-gradient(180deg, #16213e 0%, #1a1a2e 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ color: '#fff' }}
          >
            返回
          </Button>
        </Space>

        <Title level={5} style={{ color: '#fff', margin: 0 }}>
          {channel.name}
        </Title>

        <Space>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => {
              const prev = getPrevChannel();
              if (prev) {
                setCurrentChannel(prev);
                navigate(`/player/${encodeURIComponent(prev.name)}`);
              }
            }}
            style={{ color: '#fff' }}
          />

          <Button
            type="text"
            icon={
              isFavorite(channel) ? (
                <HeartFilled style={{ color: '#ff4d4f' }} />
              ) : (
                <HeartOutlined />
              )
            }
            onClick={() => toggleFavorite(channel)}
            style={{ color: isFavorite(channel) ? '#ff4d4f' : '#fff' }}
          />

          <Button
            type="text"
            icon={<RightOutlined />}
            onClick={() => {
              const next = getNextChannel();
              if (next) {
                setCurrentChannel(next);
                navigate(`/player/${encodeURIComponent(next.name)}`);
              }
            }}
            style={{ color: '#fff' }}
          />

          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setShowChannelList(true)}
            style={{ color: '#fff' }}
          >
            频道
          </Button>
        </Space>
      </div>

      {/* 视频播放器 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <VideoPlayer
          src={channel.url}
          title={channel.name}
          volume={volume}
          muted={isMuted}
          onVolumeChange={setVolume}
          onMuteChange={toggleMute}
        />
      </div>

      {/* 频道列表抽屉 */}
      <Drawer
        title="频道列表"
        placement="right"
        onClose={() => setShowChannelList(false)}
        open={showChannelList}
        width={320}
        bodyStyle={{ padding: 0, background: '#1a1a2e' }}
        headerStyle={{ background: '#16213e', color: '#fff' }}
      >
        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
          {renderChannelList()}
        </div>
      </Drawer>
    </div>
  );
}

export default Player;
