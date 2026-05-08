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
      className={`channel-card ${isPlaying ? 'channel-card-playing' : ''}`}
      onClick={handlePlay}
    >
      <div className="channel-card-image">
        {channel.logo ? (
          <img 
            src={channel.logo} 
            alt={channel.name}
            className="channel-card-logo"
          />
        ) : (
          <PlayCircleOutlined className="channel-card-placeholder" />
        )}
        {isPlaying && (
          <div className="channel-card-live">LIVE</div>
        )}
      </div>
      <div className="channel-card-info">
        <h3 className="channel-card-name">{channel.name}</h3>
        <div className="channel-card-meta">
          <span className="channel-card-category">{channel.category?.name || '未分类'}</span>
          <Tooltip title="收藏">
            <Button 
              type="text" 
              icon={<StarOutlined />}
              onClick={handleFavorite}
              className="channel-card-favorite"
            />
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}

export default ChannelCard;