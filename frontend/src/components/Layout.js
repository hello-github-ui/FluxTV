/**
 * 布局组件
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:20:00
 */

import { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar } from 'antd';
import { 
  HomeOutlined, 
  PlaySquareOutlined, 
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store/store';
import { userAPI } from '../api/api';

const { Header, Sider, Content } = AntLayout;

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, clearUser } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  // 获取用户信息
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      userAPI.getProfile().then((res) => {
        if (res.success) {
          setUser(res.data);
        }
      }).catch(() => {
        clearUser();
      });
    }
  }, []);

  // 退出登录
  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  // 用户菜单
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人中心
      </Menu.Item>
      {user?.role === 1 && (
        <Menu.Item 
          key="admin" 
          icon={<DashboardOutlined />}
          onClick={() => navigate('/admin')}
        >
          管理后台
        </Menu.Item>
      )}
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  // 侧边栏菜单
  const sideMenu = (
    <Menu
      mode="inline"
      defaultSelectedKeys={['home']}
      selectedKeys={[location.pathname === '/' ? 'home' : 'player']}
      style={{ height: '100%', borderRight: 0 }}
    >
      <Menu.Item 
        key="home" 
        icon={<HomeOutlined />}
        onClick={() => navigate('/')}
      >
        频道列表
      </Menu.Item>
      <Menu.Item 
        key="player" 
        icon={<PlaySquareOutlined />}
        onClick={() => navigate('/player')}
      >
        播放器
      </Menu.Item>
    </Menu>
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#010a1f', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ color: '#fff', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            FluxTV
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Button type="text" icon={<Avatar icon={<UserOutlined />} />}>
                {user.username}
              </Button>
            </Dropdown>
          ) : (
            <>
              <Button onClick={() => navigate('/login')}>登录</Button>
              <Button onClick={() => navigate('/register')}>注册</Button>
            </>
          )}
        </div>
      </Header>
      <AntLayout>
        <Sider 
          collapsible 
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{ background: '#0a1628' }}
        >
          <div className="logo" style={{ padding: '16px' }} />
          {sideMenu}
        </Sider>
        <Content style={{ 
          background: '#0d1b2a', 
          padding: '24px',
          minHeight: 'calc(100vh - 64px)'
        }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;