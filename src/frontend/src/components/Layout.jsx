import React, { useState } from 'react';
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

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/rooms',
      icon: <HomeOutlined />,
      label: '房间管理',
    },
    {
      key: '/applications',
      icon: <FileTextOutlined />,
      label: '申请管理',
    },
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
      
      <Layout style={{ background: 'var(--background-color)' }}>
        <Header style={{ 
          background: 'var(--component-bg)', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow)',
          zIndex: 1,
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{ flex: 1 }} />
          
          <Space>
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
                    {user?.role || '普通用户'}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '24px',
          padding: '24px',
          background: 'var(--component-bg)',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)',
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