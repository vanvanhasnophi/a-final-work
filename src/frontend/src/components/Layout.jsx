import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button } from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BulbOutlined,
  BulbFilled,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getRoleDisplayName } from '../utils/roleMapping';
import NotificationCenter from './NotificationCenter';
import { getCsrfStatus, probeCsrf } from '../security/csrf';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [csrfInfo, setCsrfInfo] = useState({ enabled: true, tokenPresent: false });

  useEffect(() => {
    // 初次挂载探测一次 CSRF 状态
    (async () => {
      try { await probeCsrf(); setCsrfInfo(getCsrfStatus()); } catch (_) {}
    })();
    const interval = setInterval(() => {
      setCsrfInfo(getCsrfStatus());
    }, 30000); // 30s 刷新一次展示状态
    return () => clearInterval(interval);
  }, []);



  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/rooms',
      icon: <HomeOutlined />,
      label: '教室管理',
    },
    // 根据角色显示申请相关菜单
    ...(user?.role === 'ADMIN' || user?.role === 'APPROVER' ? [{
      key: '/applications',
      icon: <FileTextOutlined />,
      label: '申请管理',
    }] : []),
    ...(user?.role === 'APPLIER' ? [{
      key: '/my-applications',
      icon: <FileTextOutlined />,
      label: '我的申请',
    }] : []),
    // 仅管理员可见的用户管理菜单
    ...(user?.role === 'ADMIN' ? [{
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    }] : []),
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const selectedKey = menuItems.find(item => 
    location.pathname === item.key
  )?.key || '/dashboard';

  return (
    <Layout style={{ 
      minHeight: '100vh',
      background: 'var(--background-color)',
    }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          boxShadow: 'var(--shadow)',
          background: 'var(--component-bg)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--component-bg)',
        }}>
          <Text strong style={{ 
            color: 'var(--primary-color)', 
            fontSize: collapsed ? '14px' : '18px' 
          }}>
            {collapsed ? 'RX' : 'RoomX'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            borderRight: 0,
            background: 'var(--component-bg)',
          }}
          theme={isDarkMode ? 'dark' : 'light'}
        />
      </Sider>
      
      <Layout style={{ 
        background: 'var(--background-color)',
        marginLeft: collapsed ? '80px' : '200px',
        transition: 'margin-left 0.2s',
      }}>
        <Header style={{ 
          position: 'fixed',
          top: 0,
          right: 0,
          left: collapsed ? '80px' : '200px',
          zIndex: 999,
          background: 'var(--component-bg)', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow)',
          borderBottom: '1px solid var(--border-color)',
          transition: 'left 0.2s',
        }}>
          <div style={{ flex: 1 }} />
          
          <Space>
            {/* CSRF 状态指示 */}
            <div style={{
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 12,
              background: csrfInfo.enabled ? (csrfInfo.tokenPresent ? '#d9f7be' : '#ffe58f') : '#ffd8bf',
              color: 'var(--text-color)',
              border: '1px solid var(--border-color)'
            }}
              title={csrfInfo.enabled ? (csrfInfo.tokenPresent ? 'CSRF 已启用且令牌存在 (XSRF-TOKEN)' : 'CSRF 已启用但当前未检测到令牌，后续写操作前会自动补取') : 'CSRF 已关闭'}
            >
              CSRF: {csrfInfo.enabled ? (csrfInfo.tokenPresent ? 'ON' : 'NO TOKEN') : 'OFF'}
            </div>
            {/* 通知中心 */}
            <NotificationCenter />
            
            {/* 主题切换按钮 */}
            <Button
              type="text"
              icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
              onClick={toggleTheme}
              style={{
                color: 'var(--text-color)',
                border: '1px solid var(--border-color)',
                background: 'var(--component-bg)',
              }}
              title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
            />
            
            {/* 用户信息 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ 
                    backgroundColor: 'var(--primary-color)',
                    color: '#fff',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong style={{ 
                    fontSize: '14px', 
                    lineHeight: '1',
                    color: 'var(--text-color)',
                  }}>
                    {user?.nickname || user?.username || '用户'}
                  </Text>
                  <Text type="secondary" style={{ 
                    fontSize: '12px', 
                    lineHeight: '1',
                    color: 'var(--text-color-secondary)',
                  }}>
                    {getRoleDisplayName(user?.role)}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '88px 24px 24px 24px',
          padding: '24px',
          background: 'var(--component-bg)',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 136px)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-color)',
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
} 