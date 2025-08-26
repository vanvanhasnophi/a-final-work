import React, { useState, useEffect ,useContext } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, theme } from 'antd';
import { BlurContext } from '../../App';
import {
  DashboardOutlined,
  UserOutlined,
  BellOutlined,
  TeamOutlined,
  HomeOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
  BulbOutlined,
  CalendarOutlined,
  FormOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleColor } from '../../utils/permissionUtils';
import { getRoleDisplayName } from '../../utils/roleMapping';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import NotificationCenter from '../NotificationCenter';
import NotificationBanner from '../NotificationBanner';
import FeedbackButton from '../FeedbackButton';
import { notificationEvents, NOTIFICATION_EVENTS } from '../../utils/notificationEvents';
import { notificationAPI } from '../../api/notification';
import { getUserDisplayName, getUserAvatarChar } from '../../utils/userDisplay';
import { SidebarProvider } from '../ResponsiveButton';
// import { getCsrfStatus, probeCsrf } from '../../security/csrf';

const { Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout({ children }) {
  const { user, clearAuth, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const enableMoreBlur = useContext(BlurContext);
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
  /*
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
  */
  
  // 响应式侧栏状态
  const [isAutoCollapsed, setIsAutoCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [sidebarMenuCollapsed, setSidebarMenuCollapsed] = useState(false);
  
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
          { key: 'application-management', label: t('layout.menu.applications'), icon: 'FileTextOutlined' },
          { key: 'duty-schedule', label: t('layout.menu.dutySchedule'), icon: 'CalendarOutlined' }
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
          { key: 'rooms', label: t('layout.menu.rooms'), icon: 'HomeOutlined' },
          { key: 'duty-schedule', label: t('layout.menu.dutySchedule'), icon: 'CalendarOutlined' }
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
  // 获取菜单项数量用于计算阈值
  const getMenuItemCount = (userRole) => {
    return getMenuItems(userRole).length;
  };

  // 响应式阈值 - 根据菜单项数动态调整
  const WIDTH_COLLAPSE_THRESHOLD_BASE = 800; // 小于此宽度自动折叠
  const WIDTH_EXPAND_THRESHOLD_BASE = 820;   // 大于此宽度自动展开
  const menuItemCount = user ? getMenuItemCount(user.role) : 4;
  const HEIGHT_COLLAPSE_THRESHOLD_BASE = 220 + menuItemCount  * 40;
  const HEIGHT_EXPAND_THRESHOLD_BASE = HEIGHT_COLLAPSE_THRESHOLD_BASE + 30;
  
  
  
  // 响应式侧栏处理
  useEffect(() => {
    let resizeTimer;
    let lastResizeTime = 0;
    const THROTTLE_DELAY = 50;  // 节流延迟：50ms (从100ms降低)
    const DEBOUNCE_DELAY = 100; // 防抖延迟：100ms (从200ms降低)

    const handleResize = () => {
      const now = Date.now();
      
      // 节流：如果距离上次执行时间小于延迟，跳过
      if (now - lastResizeTime < THROTTLE_DELAY) {
        return;
      }
      
      lastResizeTime = now;
      
      // 清除之前的防抖计时器
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      
      // 防抖：延迟执行真正的处理逻辑
      resizeTimer = setTimeout(() => {
        // 使用 requestAnimationFrame 确保在下一个重绘周期执行
        requestAnimationFrame(() => {
          const newWidth = window.innerWidth;
          const newHeight = window.innerHeight;
          
          // 只有当宽度或高度真正发生变化时才更新状态
          if (newWidth !== windowWidth || newHeight !== windowHeight) {
            setWindowWidth(newWidth);
            setWindowHeight(newHeight);
            
            // 宽度响应式：自动折叠逻辑
            if (newWidth < WIDTH_COLLAPSE_THRESHOLD_BASE && !collapsed) {
              setCollapsed(true);
              setIsAutoCollapsed(true);
            } 
            // 宽度响应式：自动展开逻辑 (只有在自动折叠时才自动展开)
            else if (newWidth > WIDTH_EXPAND_THRESHOLD_BASE && collapsed && isAutoCollapsed) {
              setCollapsed(false);
              setIsAutoCollapsed(false);
            }
            
            // 高度响应式：菜单折叠逻辑
            if (newHeight < HEIGHT_COLLAPSE_THRESHOLD_BASE) {
              setSidebarMenuCollapsed(true);
            } else if (newHeight > HEIGHT_EXPAND_THRESHOLD_BASE) {
              setSidebarMenuCollapsed(false);
            }
          }
        });
      }, DEBOUNCE_DELAY);
    };
    
    // 初始化检查（不使用防抖，立即执行）
    const initResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      setWindowWidth(newWidth);
      setWindowHeight(newHeight);
      
      // 宽度响应式：自动折叠逻辑
      if (newWidth < WIDTH_COLLAPSE_THRESHOLD_BASE && !collapsed) {
        setCollapsed(true);
        setIsAutoCollapsed(true);
      } 
      // 宽度响应式：自动展开逻辑 (只有在自动折叠时才自动展开)
      else if (newWidth > WIDTH_EXPAND_THRESHOLD_BASE && collapsed && isAutoCollapsed) {
        setCollapsed(false);
        setIsAutoCollapsed(false);
      }
      
      // 高度响应式：菜单折叠逻辑
      if (newHeight < HEIGHT_COLLAPSE_THRESHOLD_BASE) {
        setSidebarMenuCollapsed(true);
      } else if (newHeight > HEIGHT_EXPAND_THRESHOLD_BASE) {
        setSidebarMenuCollapsed(false);
      }
    };
    
    initResize();
    
    // 添加监听器
    window.addEventListener('resize', handleResize);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
    };
  }, [collapsed, isAutoCollapsed, windowWidth, windowHeight, WIDTH_COLLAPSE_THRESHOLD_BASE, WIDTH_EXPAND_THRESHOLD_BASE, HEIGHT_COLLAPSE_THRESHOLD_BASE, HEIGHT_EXPAND_THRESHOLD_BASE]);
  
  // 手动控制折叠状态
  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
    // 手动操作时重置自动折叠状态
    setIsAutoCollapsed(false);
  };

  

  // 处理菜单点击
  const handleMenuClick = ({ key }) => {
    navigate('/'+key);
  };

  const handleLogout = () => {
        try {
          localStorage.removeItem('localNotifications');
        } catch(e) {}
        clearAuth();
        // 额外可清理未读计数
        setUnreadCount(0);
        logout();
        navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('layout.userMenu.profile'),
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('layout.userMenu.settings'),
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('layout.userMenu.logout'),
      onClick: handleLogout,
    },
  ];

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
            const notificationsRes = await notificationAPI.getNotifications({ pageNum: 1, pageSize: 20 });
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
  }, [bannerNotification, lastBannerNotificationId, lastBannerTime, unreadCount]);

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
      case 'CalendarOutlined':
        return <CalendarOutlined />;
      default:
        return <UserOutlined />;
    }
  };



  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const pathname = location.pathname;
    const match = menuItems.find(item => pathname.startsWith('/' + item.key));
    return match ? [match.key] : [];
  };

  
  return (
    <Layout style={{ 
      minHeight: '100vh',
      background: 'var(--background-color)',
    }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          boxShadow: 'var(--shadow)',
          background: 'var(--component-bg)',
          borderRight: `1px solid ${token.colorBorder}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 999,
          transform: 'translateZ(0)', // 硬件加速
          willChange: 'width'          // 优化宽度变化性能
        }}
      >
        
        <div 
          style={{ 
            padding: '16px', 
            textAlign: 'center',
            borderBottom: `1px solid ${token.colorBorder}`,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease', // 更快的过渡
            transform: 'translateZ(0)', // 硬件加速
            backfaceVisibility: 'hidden' // 减少重绘
          }}
          onClick={handleToggleCollapse}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = token.colorBgTextHover;
            e.currentTarget.style.transform = 'translateZ(0)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateZ(0)';
          }}
        >
          <Text strong style={{ fontSize: collapsed ? '18px' : '18px', fontWeight: 600, fontVariationSettings: "'wght' 600" }}>
            {collapsed ? 'RX' : 'RoomX'}
          </Text>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto' }} className="custom-scrollbar">
          {sidebarMenuCollapsed ? (
            // 高度压缩模式：显示折叠的菜单（样式与原菜单项保持一致）
            <div style={{ padding: '8px' }}>
              <Dropdown
                menu={{
                  items: menuItems.map(item => ({
                    key: item.key,
                    icon: getMenuIcon(item.icon),
                    label: item.label,
                    onClick: () => handleMenuClick({ key: item.key })
                  })),
                  selectedKeys: getSelectedKeys(),
                  className: enableMoreBlur ? 'blur-dropdown-menu' : ''
                }}
                overlayClassName={enableMoreBlur ? 'blur-dropdown-menu' : ''}
                trigger={['hover']}
                placement="rightTop"
              >
                <div style={{
                  height: '40px',
                  lineHeight: '40px',
                  padding: '0 23px',
                  margin: '0 0 0 0',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  color: token.colorText,
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = token.colorBgTextHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                theme={isDarkMode ? 'dark' : 'light'}
                >
                  <MenuOutlined 
                    style={{ 
                      fontSize: '16px',
                      color: token.colorText,
                      marginRight: collapsed ? 0 : 12,
                      marginLeft: collapsed ? 0 : 0, // 折叠时稍微向右移动居中，展开时对齐其他图标
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} 
                    theme={isDarkMode ? 'dark' : 'light'}
                  />
                  {!collapsed && (
                    <span style={{ 
                      opacity: collapsed ? 0 : 1,
                      transition: 'opacity 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    theme={isDarkMode ? 'dark' : 'light'}>
                      {t('layout.menu.navigation')}
                    </span>
                  )}
                </div>
              </Dropdown>
            </div>
          ) : (
            // 正常模式：显示完整菜单
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
              theme={isDarkMode ? 'dark' : 'light'}
            />
          )}
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
            padding: '16px 0',
            zIndex: 10,
            transform: 'translateZ(0)', // 启用硬件加速
            willChange: 'transform'      // 优化动画性能
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
              transition: 'background-color 0.15s ease, width 0.15s ease, transform 0.15s ease', // 更快的过渡
              marginLeft: collapsed ? 0 : 20,
              marginRight: collapsed ? 0 : 20,
              fontWeight: unreadCount > 0 ? 600 : 'normal',
              transform: 'translateZ(0)', // 硬件加速
              backfaceVisibility: 'hidden' // 减少重绘
            }}
            onMouseEnter={(e) => {
              if (unreadCount === 0) {
                e.currentTarget.style.backgroundColor = token.colorBgTextHover;
                e.currentTarget.style.transform = 'translateZ(0)';
              }
            }}
            onMouseLeave={(e) => {
              if (unreadCount === 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateZ(0)';
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
              transition: 'background-color 0.15s ease, width 0.15s ease, transform 0.15s ease', // 更快的过渡
              marginLeft: collapsed ? 0 : 20,
              marginRight: collapsed ? 0 : 20,
              transform: 'translateZ(0)', // 硬件加速
              backfaceVisibility: 'hidden' // 减少重绘
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = token.colorBgTextHover;
              e.currentTarget.style.transform = 'translateZ(0)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateZ(0)';
            }}
          >
            {!collapsed && (
              <span style={{ marginLeft: 8 }}>
                {isDarkMode ? t('layout.themeLight') : t('layout.themeDark')}
              </span>
            )}
          </Button>
          {/* 用户信息 */}
          <Dropdown
            menu={{ items: userMenuItems ,
                  className: enableMoreBlur ? 'blur-dropdown-menu' : ''
                }}
                overlayClassName={enableMoreBlur ? 'blur-dropdown-menu' : ''}
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
              transition: 'background-color 0.15s ease, width 0.15s ease, transform 0.15s ease', // 更快的过渡
              width: collapsed ? 'auto' : 'calc(100% - 32px)',
              marginLeft: collapsed ? 0 : 16,
              marginRight: collapsed ? 0 : 16,
              transform: 'translateZ(0)', // 硬件加速
              backfaceVisibility: 'hidden' // 减少重绘
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = token.colorBgTextHover;
              e.currentTarget.style.transform = 'translateZ(0)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateZ(0)';
            }}
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
        background: 'var(--background-color)',
        marginLeft: collapsed ? '80px' : '200px',
        transition: 'margin-left 0.15s ease', // 更快的过渡
        transform: 'translateZ(0)',            // 硬件加速
        willChange: 'margin-left'              // 优化margin变化
      }}>
        <Content style={{ 
          margin: '16px',
          padding: '24px',
          background: token.colorBgContainer,
          borderRadius: token.borderRadius
        }}>
          <SidebarProvider collapsed={collapsed}>
            {children}
          </SidebarProvider>
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
            const localRaw = localStorage.getItem('localNotifications');
            if (localRaw) {
              try {
                const localList = JSON.parse(localRaw);
                const targetIndex = localList.findIndex(n => n.id === notificationId);
                if (targetIndex !== -1) {
                  localList[targetIndex] = { ...localList[targetIndex], isRead: true };
                  localStorage.setItem('localNotifications', JSON.stringify(localList));
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
      
        
        
      {/* 悬浮反馈按钮 */}
      <FeedbackButton />
    </Layout>
  );
} 
