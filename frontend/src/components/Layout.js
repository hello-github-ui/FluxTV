/**
 * 布局组件
 * 作者: 19920728
 * 创建日期: 2026-05-08 12:00:00
 */

import { useState, useEffect, useMemo } from 'react';
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

  // 用户菜单 - 使用 items 格式
  const userMenuItems = useMemo(() => {
    const items = [
      {
        key: 'profile',
        label: '个人中心',
        icon: <UserOutlined />,
        onClick: () => navigate('/profile'),
      },
      {
        key: 'settings',
        label: '设置',
        icon: <SettingOutlined />,
        onClick: () => navigate('/settings'),
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      },
    ];

    // 如果是管理员，添加管理后台菜单
    if (user?.role === 1) {
      items.splice(1, 0, {
        key: 'admin',
        label: '管理后台',
        icon: <DashboardOutlined />,
        onClick: () => navigate('/admin'),
      });
    }

    return items;
  }, [user, navigate]);

  // 侧边栏菜单 - 使用 items 格式
  const sideMenuItems = useMemo(() => {
    const items = [
      {
        key: 'home',
        label: '频道列表',
        icon: <HomeOutlined />,
        onClick: () => navigate('/'),
      },
      {
        key: 'player',
        label: '播放器',
        icon: <PlaySquareOutlined />,
        onClick: () => navigate('/player'),
      },
    ];
    
    // 如果是管理员，添加管理后台入口（明显显示）
    if (user?.role === 1) {
      items.push({
        type: 'divider',
      });
      items.push({
        key: 'admin',
        label: '管理后台',
        icon: <DashboardOutlined />,
        onClick: () => navigate('/admin'),
      });
    }
    
    return items;
  }, [user, navigate]);

  // 确定当前选中的菜单项
  const selectedKey = useMemo(() => {
    return location.pathname === '/' ? 'home' : 'player';
  }, [location.pathname]);

  return (
    <AntLayout className="flux-layout">
      <Header className="flux-header">
        <div className="flux-logo">
          <h1 className="flux-title">FluxTV</h1>
        </div>
        <div className="flux-user-menu">
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
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
          className="flux-sider"
        >
          <div className="flux-logo-inner" />
          <Menu
            mode="inline"
            defaultSelectedKeys={['home']}
            selectedKeys={[selectedKey]}
            className="flux-menu"
            items={sideMenuItems}
          />
        </Sider>
        <Content className="flux-content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;