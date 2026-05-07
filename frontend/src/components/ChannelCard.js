/**
 * 频道卡片组件
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:25:00
 */

import { Card, Button, Tooltip } from 'antd';
import { PlayCircleOutlined, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import { userAPI } from '../api/api';

function ChannelCard({ channel }) {
  const navigate = useNavigate();
  const { user, currentChannel } = useStore();
  const isPlaying = currentChannel?.id === channel.id;

  // 播放频道
  const handlePlay = () => {
    navigate(`/player/${channel.id}`);
  };

  // 添加收藏
  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await userAPI.addFavorite({ channelId: channel.id });
    } catch (err) {
      console.error('收藏失败:', err);
    }
  };

  return (
    <Card
      hoverable
      style={{ 
        background: '#1b2838', 
        borderColor: '#2a475e',
        cursor: 'pointer',
        transform: isPlaying ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isPlaying ? '0 4px 20px rgba(99, 102, 241, 0.3)' : 'none'
      }}
      onClick={handlePlay}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ 
        position: 'relative', 
        height: '120px', 
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {channel.logo ? (
          <img 
            src={channel.logo} 
            alt={channel.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : (
          <PlayCircleOutlined style={{ fontSize: '48px', color: '#6366f1' }} />
        )}
        {isPlaying && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#6366f1',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            LIVE
          </div>
        )}
      </div>
      <div style={{ marginTop: '12px' }}>
        <h3 style={{ 
          color: '#fff', 
          margin: '0 0 8px 0',
          fontSize: '14px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {channel.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#8b949e', fontSize: '12px' }}>
            {channel.category?.name || '未分类'}
          </span>
          <Tooltip title="收藏">
            <Button 
              type="text" 
              icon={<StarOutlined />}
              onClick={handleFavorite}
              style={{ padding: '0', color: '#8b949e' }}
            />
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}

export default ChannelCard;