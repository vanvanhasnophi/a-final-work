import React, { useState, useEffect } from 'react';
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
import { getRoleColor } from '../utils/permissionUtils';
import { getRoleDisplayName } from '../utils/roleMapping';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import NotificationCenter from './NotificationCenter';
import NotificationBanner from './NotificationBanner';
import { notificationEvents, NOTIFICATION_EVENTS } from '../utils/notificationEvents';
import { notificationAPI } from '../api/notification';
import { getUserDisplayName, getUserAvatarChar } from '../utils/userDisplay';

const { Sider, Content } = Layout;
const { Text } = Typography;

const RoleBasedLayout = ({ children }) => {
  const { user, clearAuth } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const { token } = theme.useToken();
  const [unreadCount, setUnreadCount] = useState(0);
  const [bannerNotification, setBannerNotification] = useState(null);
  const [lastBannerNotificationId, setLastBannerNotificationId] = useState(null);
  const [lastBannerTime, setLastBannerTime] = useState(0);
  // 温柔的事件驱动通知系统
  useEffect(() => {
    // 监听新通知事件
    const unsubscribeNewNotification = notificationEvents.addEventListener(
      NOTIFICATION_EVENTS.NEW_NOTIFICATION,
      (notification) => {
        // 首先检查通知是否应该显示
        if (!notification || notification.isRead) {
          return;
        }

        const now = Date.now();
        
        // 防止短时间内重复显示相同通知（30秒间隔）
        if (lastBannerNotificationId === notification.id && now - lastBannerTime < 30000) {
          console.log(`通知 ${notification.id} 在30秒内重复触发，跳过显示`);
          return;
        }

        // 检查今天横幅是否已经显示过太多次
        const today = new Date().toDateString();
        const bannerCountKey = `notification_banner_count_${notification.id}_${today}`;
        const currentCount = parseInt(localStorage.getItem(bannerCountKey) || '0');
        
        console.log(`检查通知 ${notification.id}: 今天横幅显示次数 ${currentCount}`);
        
        if (currentCount >= 3) {
          console.log(`通知 ${notification.id} 今天横幅显示次数已达上限，阻止设置横幅`);
          return;
        }

        // 检查是否是相同的通知（避免重复设置）
        if (bannerNotification && bannerNotification.id === notification.id) {
          console.log(`通知 ${notification.id} 已在显示中，跳过重复设置`);
          return;
        }

        // 所有检查通过，设置横幅通知
        setBannerNotification(notification);
        setLastBannerNotificationId(notification.id);
        setLastBannerTime(now);
        console.log(`设置横幅通知: ${notification.id}`);
      }
    );

    // 监听未读数量变化
    const unsubscribeUnreadChanged = notificationEvents.addEventListener(
      NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED,
      (count) => {
        console.log(`未读计数更新为: ${count}`);
        setUnreadCount(count);
      }
    );

    // 初始化时获取未读数量（优化版本）
    const initializeUnreadCount = async () => {
      try {
        console.log('初始化未读计数...');
        
        // 先获取服务器未读数量
        let serverUnread = 0;
        try {
          const res = await notificationAPI.getUnreadCount();
          serverUnread = res?.data?.unreadCount || 0;
          console.log(`服务器未读数量: ${serverUnread}`);
        } catch (e) {
          console.warn('获取服务器未读数量失败:', e);
        }

        // 获取本地通知中的未读数量
        let localUnread = 0;
        try {
          const localRaw = localStorage.getItem('localNotifications');
          if (localRaw) {
            const localList = JSON.parse(localRaw);
            localUnread = localList.filter(n => !n.isRead).length;
            console.log(`本地未读数量: ${localUnread}`);
          }
        } catch (e) {
          console.warn('获取本地未读数量失败:', e);
        }

        const totalUnread = serverUnread + localUnread;
        console.log(`总未读数量: ${totalUnread}`);
        setUnreadCount(totalUnread);
        
        // 触发未读数量变化事件
        notificationEvents.emit(NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED, totalUnread);
      } catch (e) {
        console.warn('初始化未读计数失败:', e);
      }
    };

    initializeUnreadCount();

    // 设置定期检查（5分钟一次，既检查未读数量，也检查新通知）
    const gentleTimer = setInterval(async () => {
      try {
        console.log('定期检查未读数量和新通知...');
        
        // 1. 检查未读数量
        const res = await notificationAPI.getUnreadCount();
        const serverUnread = res?.data?.unreadCount || 0;
        
        const localRaw = localStorage.getItem('localNotifications');
        let localUnread = 0;
        if (localRaw) {
          const list = JSON.parse(localRaw).filter(n => !n.isRead);
          localUnread = list.length;
        }
        
        const totalUnread = serverUnread + localUnread;
        console.log(`定期检查 - 服务器: ${serverUnread}, 本地: ${localUnread}, 总计: ${totalUnread}`);
        
        // 2. 如果未读数量增加，可能有新通知，触发通知检查
        if (totalUnread > unreadCount) {
          console.log(`检测到未读数量增加 (${unreadCount} -> ${totalUnread})，检查新通知`);
          
          // 获取最新通知列表来检查是否有新通知
          try {
            const notificationsRes = await notificationAPI.getNotifications({ pageNum: 1, pageSize: 5 });
            const notifications = notificationsRes?.data?.records || notificationsRes?.data?.list || notificationsRes?.data || [];
            
            if (notifications.length > 0) {
              // 查找最新的未读通知
              const latestUnread = notifications.find(n => !n.isRead);
              if (latestUnread) {
                console.log(`发现新通知: ${latestUnread.id}`);
                
                // 触发新通知事件
                setTimeout(() => {
                  notificationEvents.emit(NOTIFICATION_EVENTS.NEW_NOTIFICATION, latestUnread);
                }, 200);
              }
            }
          } catch (notificationError) {
            console.warn('获取通知列表失败:', notificationError);
          }
        }
        
        setUnreadCount(totalUnread);
        
        // 触发未读数量变化事件
        notificationEvents.emit(NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED, totalUnread);
      } catch (e) {
        console.debug('定期检查失败:', e);
      }
    }, 300000); // 5分钟

    return () => {
      unsubscribeNewNotification();
      unsubscribeUnreadChanged();
      clearInterval(gentleTimer);
    };
  }, [bannerNotification]);

  // 登录跳转后若存在自动打开通知中心标记，则打开后清除
  useEffect(() => {
    try {
      if (localStorage.getItem('openNotificationCenter') === '1') {
        setNotificationVisible(true);
        localStorage.removeItem('openNotificationCenter');
      }
    } catch(e) {}
  }, []);

  if (!user) {
    return <div>{t('layout.pleaseLogin')}</div>;
  }

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('layout.userMenu.profile'),
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('layout.userMenu.settings'),
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('layout.userMenu.logout'),
      onClick: () => {
        try {
          localStorage.removeItem('localNotifications');
        } catch(e) {}
        clearAuth();
        // 额外可清理未读计数
        setUnreadCount(0);
        navigate('/login');
      }
    }
  ];

  // 获取用户角色的菜单配置（移除个人资料）
  const getMenuItems = (userRole) => {
    const baseMenu = [
      { key: 'dashboard', label: t('layout.menu.dashboard'), icon: 'DashboardOutlined' },
    ];

    const roleSpecificMenu = [];
    
    switch (userRole) {
      case 'ADMIN':
        roleSpecificMenu.push(
          { key: 'user-management', label: t('layout.menu.users'), icon: 'TeamOutlined' },
          { key: 'rooms', label: t('layout.menu.rooms'), icon: 'HomeOutlined' },
          { key: 'application-management', label: t('layout.menu.applications'), icon: 'FileTextOutlined' }
        );
        break;
      case 'APPLIER':
        roleSpecificMenu.push(
          { key: 'my-applications', label: t('layout.menu.myApplications'), icon: 'FormOutlined' },
          { key: 'rooms', label: t('layout.menu.rooms'), icon: 'HomeOutlined' }
        );
        break;
      case 'APPROVER':
        roleSpecificMenu.push(
          { key: 'application-management', label: t('layout.menu.applications'), icon: 'FileTextOutlined' },
          { key: 'rooms', label: t('layout.menu.rooms'), icon: 'HomeOutlined' }
        );
        break;
      case 'SERVICE':
      case 'MAINTAINER':
        roleSpecificMenu.push(
          { key: 'rooms', label: t('layout.menu.rooms'), icon: 'HomeOutlined' }
        );
        break;
      default:
        // 默认情况下只显示房间管理
        roleSpecificMenu.push(
          { key: 'rooms', label: t('layout.menu.rooms'), icon: 'HomeOutlined' }
        );
        break;
    }
    
    return [...baseMenu, ...roleSpecificMenu];
  };

  const menuItems = getMenuItems(user.role);
  
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
          <Text strong style={{ fontSize: collapsed ? '18px' : '18px', fontWeight: 600, fontVariationSettings: "'wght' 600" }}>
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
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            background: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '7px',
            padding:  '16px 0',
            zIndex: 10
          }}
        >
          {/* 通知中心 */}
          <Button
            type="text"
            icon={<BellOutlined />}
            onClick={() => setNotificationVisible(true)}
            className={`notification-trigger ${unreadCount > 0 ? 'unread' : ''}`}
            style={{
              height: '35px',
              width: collapsed ? 'auto' : 'calc(100% - 40px)',
              padding: collapsed ? '0' : '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              border: 'none',
              boxShadow: 'none',
              transition: 'background-color 0.2s, width 0.2s, box-shadow 0.25s',
              marginLeft: collapsed ? 0 : 20,
              marginRight: collapsed ? 0 : 20,
              fontWeight: unreadCount > 0 ? 600 : 'normal'
            }}
            onMouseEnter={(e) => {
              if (unreadCount === 0) {
                e.currentTarget.style.backgroundColor = token.colorBgTextHover;
              }
            }}
            onMouseLeave={(e) => {
              if (unreadCount === 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {collapsed ? (
              unreadCount > 0 ? <span className="num-mono" style={{ marginLeft: 6 }}>{unreadCount}</span> : null
            ) : (
              <span style={{ marginLeft: 8 }}>
                {t('layout.notifications','通知')}{unreadCount > 0 ? `(${unreadCount})` : ''}
              </span>
            )}
          </Button>
          {/* 主题切换 */}
          <Button
            type="text"
            icon={<BulbOutlined />}
            onClick={toggleTheme}
            style={{
              height: '35px',
              width: collapsed ? 'auto' : 'calc(100% - 40px)',
              padding: collapsed ? '0' : '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              border: 'none',
              boxShadow: 'none',
              borderRadius: '6px',
              transition: 'background-color 0.2s, width 0.2s',
              marginLeft: collapsed ? 0 : 20,
              marginRight: collapsed ? 0 : 20
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = token.colorBgTextHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {!collapsed && (
              <span style={{ marginLeft: 8 }}>
                {isDarkMode ? t('layout.themeLight') : t('layout.themeDark')}
              </span>
            )}
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
              transition: 'background-color 0.2s, width 0.2s',
              width: collapsed ? 'auto' : 'calc(100% - 32px)',
              marginLeft: collapsed ? 0 : 16,
              marginRight: collapsed ? 0 : 16
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = token.colorBgTextHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Avatar 
                size={32}
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
        onUnreadChange={(n) => setUnreadCount(n)}
      />
      
      {/* 温柔的通知横幅 */}
      <NotificationBanner
        notification={bannerNotification}
        onClose={() => setBannerNotification(null)}
        onViewNotifications={() => {
          setNotificationVisible(true);
          setBannerNotification(null);
        }}
        onMarkAsRead={async (notificationId) => {
          // 实际标记已读逻辑
          try {
            console.log(`标记通知 ${notificationId} 为已读`);
            
            // 获取当前通知信息
            const notification = bannerNotification;
            const wasUnread = notification && !notification.isRead;
            
            console.log(`通知 ${notificationId} 当前未读状态: ${wasUnread}`);
            
            // 更新本地存储的通知状态（如果存在）
            let localUpdated = false;
            const localRaw = localStorage.getItem('localNotifications');
            if (localRaw) {
              try {
                const localList = JSON.parse(localRaw);
                const targetIndex = localList.findIndex(n => n.id === notificationId);
                if (targetIndex !== -1) {
                  localList[targetIndex] = { ...localList[targetIndex], isRead: true };
                  localStorage.setItem('localNotifications', JSON.stringify(localList));
                  localUpdated = true;
                  console.log(`本地通知 ${notificationId} 已更新为已读`);
                }
              } catch (e) {
                console.warn('更新本地通知失败:', e);
              }
            }
            
            // 调用API标记为已读（如果不是纯本地通知）
            if (notification && !notification.local) {
              try {
                await notificationAPI.markAsRead(notificationId);
                console.log(`服务器通知 ${notificationId} 已通过API标记为已读`);
              } catch (apiError) {
                console.error('API标记已读失败:', apiError);
                // API失败时不影响本地计数更新
              }
            }
            
            // 只有当通知确实从未读变为已读时才减少计数
            if (wasUnread) {
              setUnreadCount(prevCount => {
                const newCount = Math.max(0, prevCount - 1);
                console.log(`未读计数更新: ${prevCount} -> ${newCount} (通知${notificationId}已读)`);
                
                // 触发未读数量变化事件（使用最新的计数值）
                setTimeout(() => {
                  notificationEvents.emit(NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED, newCount);
                }, 0);
                
                return newCount;
              });
              
              // 触发通知已读事件，通知其他组件（如NotificationCenter）
              setTimeout(() => {
                notificationEvents.emit(NOTIFICATION_EVENTS.NOTIFICATION_READ, { 
                  id: notificationId, 
                  notification 
                });
              }, 0);
              
            } else {
              console.log(`通知 ${notificationId} 已经是已读状态，无需更新计数`);
            }
            
            console.log('通知标记已读操作完成:', notificationId);
          } catch (error) {
            console.error('标记通知已读失败:', error);
          }
        }}
        onCollapseNotificationCenter={() => {
          setNotificationVisible(false);
          setBannerNotification(null);
        }}
      />
    </Layout>
  );
};

export default RoleBasedLayout; 