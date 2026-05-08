/**
 * 设置页面组件
 * 作者: 19920728
 * 创建日期: 2026-05-08 20:15:00
 */

import { useState } from 'react';
import { Card, Button, Switch, message } from 'antd';
import { BellOutlined, EyeOutlined, PlayCircleOutlined, MoonOutlined } from '@ant-design/icons';
import useStore from '../store/store';

function Settings() {
  const { user } = useStore();
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  // 从localStorage读取当前主题设置
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === null ? true : savedTheme === 'dark';
  });

  const handleSave = () => {
    message.success('设置已保存');
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <p style={{ color: '#8b949e' }}>请先登录</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <Card className="settings-card" title="播放设置">
        <div className="settings-row">
          <div className="settings-label">
            <PlayCircleOutlined className="settings-icon" />
            <span className="settings-title">自动播放</span>
            <span className="settings-desc">进入播放页自动开始播放</span>
          </div>
          <Switch 
            checked={autoPlay} 
            onChange={setAutoPlay}
          />
        </div>
        
        <div className="settings-row">
          <div className="settings-label">
            <EyeOutlined className="settings-icon" />
            <span className="settings-title">高清优先</span>
            <span className="settings-desc">优先选择高清画质</span>
          </div>
          <Switch 
            checked={highQuality} 
            onChange={setHighQuality}
          />
        </div>
      </Card>

      <Card className="settings-card" title="通知设置">
        <div className="settings-row">
          <div className="settings-label">
            <BellOutlined className="settings-icon" />
            <span className="settings-title">接收通知</span>
            <span className="settings-desc">接收直播更新和系统通知</span>
          </div>
          <Switch 
            checked={notifications} 
            onChange={setNotifications}
          />
        </div>
      </Card>

      <Card className="settings-card" title="外观设置">
        <div className="settings-row">
          <div className="settings-label">
            <MoonOutlined className="settings-icon" />
            <span className="settings-title">深色模式</span>
            <span className="settings-desc">使用深色主题</span>
          </div>
          <Switch 
            checked={darkMode} 
            onChange={(checked) => {
              setDarkMode(checked);
              // 应用主题切换
              if (checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
              } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
              }
              // 刷新页面以应用主题
              setTimeout(() => {
                window.location.reload();
              }, 300);
            }}
          />
        </div>
      </Card>

      <Button type="primary" onClick={handleSave}>
        保存设置
      </Button>
    </div>
  );
}

export default Settings;