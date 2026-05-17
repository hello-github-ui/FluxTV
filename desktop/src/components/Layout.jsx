/**
 * FluxTV 布局组件
 *
 * 功能：
 * - 应用主布局结构
 * - 顶部导航栏
 * - 内容区域
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntdLayout, Button, Typography, Space, Tooltip, Drawer } from 'antd';
import {
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/store';
import Settings from '../pages/Settings';

const { Header, Content } = AntdLayout;
const { Text } = Typography;

/**
 * 主布局组件
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子组件
 */
function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshChannels, channelsLoading } = useStore();
  const [settingsVisible, setSettingsVisible] = useState(false);

  /**
   * 获取当前页面标题
   */
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return '直播';
      default:
        if (location.pathname.startsWith('/player')) {
          return '播放';
        }
        return 'FluxTV';
    }
  };

  return (
    <AntdLayout style={{ height: '100vh', background: '#1a1a2e' }}>
      {/* 顶部导航栏 */}
      <Header
        style={{
          background: 'linear-gradient(180deg, #16213e 0%, #1a1a2e 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* 左侧：Logo 和标题 */}
        <Space size={12}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            TV
          </div>
          <Text strong style={{ color: '#fff', fontSize: 18 }}>
            FluxTV
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
            {getPageTitle()}
          </Text>
        </Space>

        {/* 右侧：操作按钮 */}
        <Space size={8}>
          <Tooltip title="刷新频道">
            <Button
              type="text"
              icon={<ReloadOutlined spin={channelsLoading} />}
              onClick={refreshChannels}
              loading={channelsLoading}
              style={{ color: '#fff' }}
            />
          </Tooltip>

          <Tooltip title="设置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(!settingsVisible)}
              style={{
                color: settingsVisible ? '#1890ff' : '#fff',
              }}
            />
          </Tooltip>
        </Space>

        {/* 设置抽屉 */}
        <Drawer
          title="设置"
          placement="right"
          onClose={() => setSettingsVisible(false)}
          open={settingsVisible}
          width={500}
          styles={{
            body: { background: '#1a1a2e' },
            header: { background: '#16213e', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' },
          }}
        >
          <Settings />
        </Drawer>
      </Header>

      {/* 内容区域 */}
      <Content
        style={{
          height: 'calc(100vh - 56px)',
          overflow: location.pathname.startsWith('/player') ? 'hidden' : 'auto',
          background: '#1a1a2e',
        }}
      >
        {children}
      </Content>
    </AntdLayout>
  );
}

export default AppLayout;
