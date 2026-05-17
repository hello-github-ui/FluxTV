/**
 * FluxTV 频道卡片组件
 *
 * 功能：
 * - 显示频道信息（名称、图标、分类）
 * - 处理频道点击事件
 * - 显示收藏状态
 */

import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Badge, Button, Tooltip } from 'antd';
import { PlayCircleOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useStore } from '../store/store';

const { Text } = Typography;

/**
 * 频道卡片组件
 * @param {Object} props
 * @param {Object} props.channel - 频道对象
 */
function ChannelCard({ channel }) {
  const navigate = useNavigate();
  const { setCurrentChannel, toggleFavorite, isFavorite } = useStore();

  /**
   * 处理卡片点击
   */
  const handleClick = useCallback(() => {
    setCurrentChannel(channel);
    navigate(`/player/${encodeURIComponent(channel.name)}`);
  }, [channel, navigate, setCurrentChannel]);

  /**
   * 处理收藏按钮点击
   * @param {Event} e - 事件对象
   */
  const handleFavorite = useCallback((e) => {
    e.stopPropagation();
    toggleFavorite(channel);
  }, [channel, toggleFavorite]);

  const favorite = isFavorite(channel);

  return (
    <Card
      hoverable
      className="channel-card"
      onClick={handleClick}
      style={{
        background: 'linear-gradient(145deg, #16213e 0%, #1a1a2e 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: 12 }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* 频道图标 */}
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 8px',
            borderRadius: '50%',
            background: channel.logo
              ? `url(${channel.logo}) center/contain no-repeat`
              : 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
          }}
        >
          {!channel.logo && channel.name.charAt(0)}
        </div>

        {/* 频道名称 */}
        <Text
          ellipsis
          style={{
            color: '#fff',
            fontSize: 13,
            display: 'block',
            marginBottom: 4,
          }}
          title={channel.name}
        >
          {channel.name}
        </Text>

        {/* 分类标签 */}
        {channel.group && (
          <Badge
            count={channel.group}
            style={{
              backgroundColor: 'rgba(24, 144, 255, 0.2)',
              color: '#1890ff',
              fontSize: 10,
              marginBottom: 8,
            }}
          />
        )}
      </div>

      {/* 底部操作 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginTop: 8,
        }}
      >
        <Tooltip title={favorite ? '取消收藏' : '添加收藏'}>
          <Button
            type="text"
            size="small"
            icon={
              favorite ? (
                <HeartFilled style={{ color: '#ff4d4f' }} />
              ) : (
                <HeartOutlined />
              )
            }
            onClick={handleFavorite}
            style={{ color: favorite ? '#ff4d4f' : 'rgba(255,255,255,0.45)' }}
          />
        </Tooltip>

        <Tooltip title="播放">
          <Button
            type="text"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={handleClick}
            style={{ color: '#1890ff' }}
          />
        </Tooltip>
      </div>
    </Card>
  );
}

/**
 * 比较函数：只有当 channel 或 favorites 改变时才重新渲染
 */
function areEqual(prevProps, nextProps) {
  return prevProps.channel.name === nextProps.channel.name;
}

export default memo(ChannelCard, areEqual);
