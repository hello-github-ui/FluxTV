/**
 * 播放器页面组件
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:40:00
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Card, Button, Spin, Alert } from 'antd';
import { ArrowLeftOutlined, StarOutlined, StepForwardOutlined, StepBackwardOutlined } from '@ant-design/icons';
import VideoPlayer from '../components/VideoPlayer';
import { channelAPI, categoryAPI, userAPI } from '../api/api';
import useStore from '../store/store';

function Player() {
  const { channelId } = useParams();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedChannels, setRelatedChannels] = useState([]);
  const { user, setCurrentChannel } = useStore();

  // 获取频道信息
  useEffect(() => {
    if (!channelId) return;
    
    setLoading(true);
    setError(null);
    
    channelAPI.getChannel(channelId).then((res) => {
      if (res.success) {
        setChannel(res.data);
        setCurrentChannel(res.data);
        
        // 获取同分类的其他频道
        if (res.data.categoryId) {
          categoryAPI.getCategory(res.data.categoryId).then((catRes) => {
            if (catRes.success) {
              const related = catRes.data.channels.filter(c => c.id !== parseInt(channelId));
              setRelatedChannels(related);
            }
          });
        }
      }
      setLoading(false);
    }).catch(err => {
      console.error('获取频道失败:', err);
      setError('无法获取频道信息');
      setLoading(false);
    });
  }, [channelId]);

  // 播放错误处理
  const handleError = (err) => {
    setError(err);
  };

  // 添加收藏
  const handleFavorite = async () => {
    if (!user) {
      return;
    }
    try {
      await userAPI.addFavorite({ channelId: channel.id });
    } catch (err) {
      console.error('收藏失败:', err);
    }
  };

  // 切换到上一个/下一个频道
  const switchChannel = (direction) => {
    const currentIndex = relatedChannels.findIndex(c => c.id === channel.id);
    let nextIndex;
    
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % relatedChannels.length;
    } else {
      nextIndex = (currentIndex - 1 + relatedChannels.length) % relatedChannels.length;
    }
    
    if (relatedChannels[nextIndex]) {
      window.location.href = `/player/${relatedChannels[nextIndex].id}`;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Alert message="频道不存在" type="error" />
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {/* 主播放区域 */}
      <Col lg={18} xs={24}>
        <Card 
          style={{ background: '#1b2838', borderColor: '#2a475e' }}
          title={channel.name}
          extra={
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button 
                icon={<StepBackwardOutlined />} 
                onClick={() => switchChannel('prev')}
                disabled={relatedChannels.length === 0}
              />
              <Button 
                icon={<StarOutlined />} 
                onClick={handleFavorite}
                disabled={!user}
              />
              <Button 
                icon={<StepForwardOutlined />} 
                onClick={() => switchChannel('next')}
                disabled={relatedChannels.length === 0}
              />
              <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                返回
              </Button>
            </div>
          }
        >
          {error && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: '16px' }} />
          )}
          <VideoPlayer channel={channel} onError={handleError} />
        </Card>
        
        {/* 频道信息 */}
        <Card style={{ 
          background: '#1b2838', 
          borderColor: '#2a475e',
          marginTop: '16px'
        }}>
          <h3>频道信息</h3>
          <div style={{ display: 'flex', gap: '24px', color: '#8b949e' }}>
            <span>分类: {channel.category?.name}</span>
            <span>状态: {channel.status === 1 ? '在线' : '离线'}</span>
          </div>
        </Card>
      </Col>

      {/* 侧边栏 - 相关频道 */}
      <Col lg={6} xs={24}>
        <Card style={{ background: '#1b2838', borderColor: '#2a475e' }} title="相关频道">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {relatedChannels.map((ch) => (
              <div 
                key={ch.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  padding: '12px',
                  background: ch.id === channel.id ? '#6366f1' : '#2a475e',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => window.location.href = `/player/${ch.id}`}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  background: '#1b2838',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  {ch.logo ? (
                    <img src={ch.logo} alt={ch.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ color: '#6366f1' }}>📺</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: '14px' }}>{ch.name}</div>
                  <div style={{ color: '#8b949e', fontSize: '12px' }}>{ch.category?.name}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Col>
    </Row>
  );
}

export default Player;