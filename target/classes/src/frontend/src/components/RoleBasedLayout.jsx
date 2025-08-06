import React, { useState } from 'react';
import { Layout, Menu, Avatar, Typography, theme, Button, Dropdown } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BellOutlined,
  TeamOutlined,
  HomeOutlined,
  FileTextOutlined,
  FormOutlined,
  BulbOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { getRoleMenuConfig, getRoleColor } from '../utils/permissionUtils';
import { getRoleDisplayName } from '../utils/roleMapping';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import NotificationCenter from './NotificationCenter';
import { getUserDisplayName, getUserAvatarChar } from '../utils/userDisplay';

const { Sider, Content } = Layout;
const { Text } = Typography;

const RoleBasedLayout = ({ children }) => {
  const { user, clearAuth } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const { token } = theme.useToken();

  if (!user) {
    return <div>请先登录</div>;
  }

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        clearAuth();
        navigate('/login');
      }
    }
  ];

  // 获取用户角色的菜单配置（移除个人资料）
  const menuItems = getRoleMenuConfig(user.role).filter(item => item.key !== 'profile');
  
  // 处理菜单点击
  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'notifications':
        navigate('/notifications');
        break;
      case 'user-management':
        navigate('/user-management');
        break;
      case 'rooms':
        navigate('/rooms');
        break;
      case 'application-management':
        navigate('/application-management');
        break;
      case 'my-applications':
        navigate('/my-applications');
        break;
      case 'user-list':
        navigate('/user-list');
        break;
      default:
        break;
    }
  };

  // 获取菜单图标
  const getMenuIcon = (iconName) => {
    switch (iconName) {
      case 'DashboardOutlined':
        return <DashboardOutlined />;
      case 'UserOutlined':
        return <UserOutlined />;
      case 'BellOutlined':
        return <BellOutlined />;
      case 'TeamOutlined':
        return <TeamOutlined />;
      case 'HomeOutlined':
        return <HomeOutlined />;
      case 'FileTextOutlined':
        return <FileTextOutlined />;
      case 'FormOutlined':
        return <FormOutlined />;
      default:
        return <UserOutlined />;
    }
  };



  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const pathname = location.pathname;
    const key = pathname.substring(1); // 移除开头的 '/'
    return [key];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorder}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000
        }}
      >
        <div 
          style={{ 
            padding: '16px', 
            textAlign: 'center',
            borderBottom: `1px solid ${token.colorBorder}`,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onClick={() => setCollapsed(!collapsed)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = token.colorBgTextHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Text strong style={{ fontSize: collapsed ? '14px' : '18px' }}>
            {collapsed ? 'RX' : 'RoomX'}
          </Text>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto' }} className="custom-scrollbar">
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            items={menuItems.map(item => ({
              key: item.key,
              icon: getMenuIcon(item.icon),
              label: item.label
            }))}
            onClick={handleMenuClick}
            style={{
              borderRight: 0,
              background: 'transparent'
            }}
          />
        </div>
        
        {/* 底部功能区 */}
        <div style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          backgroundColor: token.colorBgContainer,
          flexShrink: 0,
          marginTop: 'auto',
          marginBottom: '0px',
        }}>
          {/* 通知中心 */}
          <Button
            type="text"
            icon={<BellOutlined />}
            onClick={() => setNotificationVisible(true)}
            style={{
              height: '35px',
              width: 'auto',
              padding: collapsed ? '0' : '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'left',
              border: 'none',
              boxShadow: 'none',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              minWidth: collapsed ? '40px' : 'auto'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = token.colorBgTextHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {!collapsed && <span>       通知</span>}
          </Button>
          
          {/* 主题切换 */}
          <Button
            type="text"
            icon={<BulbOutlined />}
            onClick={toggleTheme}
            style={{
              height: '35px',
              width: 'auto',
              padding: collapsed ? '0' : '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'left',
              border: 'none',
              boxShadow: 'none',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              minWidth: collapsed ? '40px' : 'auto'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = token.colorBgTextHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {!collapsed && <span>{isDarkMode ? '       浅色' : '       深色'}</span>}
          </Button>
          
          {/* 用户信息 */}
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="topRight"
            arrow
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : '8px',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = token.colorBgTextHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Avatar 
                size={collapsed ? 32 : 32}
                style={{ 
                  backgroundColor: getRoleColor(user.role),
                  flexShrink: 0,
                  color: '#ffffff'
                }}
              >
                {getUserAvatarChar(user)}
              </Avatar>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 500,
                    color: token.colorText,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {getUserDisplayName(user)}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: token.colorTextSecondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {getRoleDisplayName(user.role)}
                  </div>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </Sider>
      
      <Layout style={{ 
        marginLeft: collapsed ? '80px' : '200px',
        transition: 'margin-left 0.2s'
      }}>
        <Content style={{ 
          margin: '16px',
          padding: '24px',
          background: token.colorBgContainer,
          borderRadius: token.borderRadius,
          minHeight: '280px'
        }}>
          {children}
        </Content>
      </Layout>
      
      {/* 通知中心 */}
      <NotificationCenter 
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />
    </Layout>
  );
};

export default RoleBasedLayout; 