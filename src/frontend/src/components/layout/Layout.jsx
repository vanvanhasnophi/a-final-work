import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
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
import webSocketService from '../../services/websocketService';
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

  // 使用useRef避免WebSocket处理器中的闭包问题
  const bannerStateRef = useRef({
    bannerNotification: null,
    lastBannerNotificationId: null,
    lastBannerTime: 0
  });

  // 防抖计时器ref
  const refreshUnreadTimerRef = useRef(null);

  // 同步状态到ref
  useEffect(() => {
    bannerStateRef.current = {
      bannerNotification,
      lastBannerNotificationId,
      lastBannerTime
    };
  }, [bannerNotification, lastBannerNotificationId, lastBannerTime]);

  // 带防抖的刷新未读计数函数
  const debouncedRefreshUnreadCount = useCallback(async (immediate = false) => {
    console.log(`[Layout] 📊 debouncedRefreshUnreadCount 被调用，immediate=${immediate}`);
    
    // 如果是立即执行，清除计时器并直接执行
    if (immediate) {
      if (refreshUnreadTimerRef.current) {
        clearTimeout(refreshUnreadTimerRef.current);
        refreshUnreadTimerRef.current = null;
      }
      return await refreshUnreadCountInternal();
    }
    
    // 防抖逻辑：清除之前的计时器
    if (refreshUnreadTimerRef.current) {
      console.log('[Layout] 🕐 清除之前的防抖计时器');
      clearTimeout(refreshUnreadTimerRef.current);
    }
    
    // 设置新的防抖计时器（0.3秒）
    refreshUnreadTimerRef.current = setTimeout(async () => {
      console.log('[Layout] ⏰ 防抖延迟结束，开始执行API请求');
      refreshUnreadTimerRef.current = null;
      await refreshUnreadCountInternal();
    }, 300);
    
    console.log('[Layout] 🕐 防抖计时器已设置，将在300ms后执行');
  }, []);

  // 实际的刷新未读计数实现（内部函数）
  const refreshUnreadCountInternal = useCallback(async () => {
    try {
      console.log('[Layout] 🔄 开始获取未读计数...');
      
      // 获取服务器未读数量
      let serverUnread = 0;
      try {
        const res = await notificationAPI.getUnreadCountByUser(user.id);
        serverUnread = res?.data?.unreadCount || 0;
        console.log(`[Layout] 📡 服务器未读数量: ${serverUnread}`);
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
        }
        console.log(`[Layout] 💾 本地未读数量: ${localUnread}`);
      } catch (e) {
        console.warn('获取本地未读数量失败:', e);
      }

      const totalUnread = serverUnread + localUnread;
      console.log(`[Layout] 🔢 总未读数量: ${totalUnread} (服务器: ${serverUnread} + 本地: ${localUnread})`);
      setUnreadCount(totalUnread);
      
      // 触发未读数量变化事件
      notificationEvents.emit(NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED, totalUnread);
      return totalUnread;
    } catch (e) {
      console.warn('刷新未读计数失败:', e);
      return 0;
    }
  }, [setUnreadCount]); // 依赖于 setUnreadCount

  // 向后兼容的函数名
  const refreshUnreadCount = debouncedRefreshUnreadCount;
  // 统一的通知处理函数
  const handleNotification = useCallback(async (notification, options = {}) => {
    const { 
      showBanner = false,           // 是否显示横幅
      updateList = true,            // 是否更新通知列表
      updateCount = true,           // 是否更新未读计数
      source = 'unknown'            // 来源标识（用于日志）
    } = options;

    console.log(`[通知处理] 来源: ${source}, 通知ID: ${notification?.id}, 显示横幅: ${showBanner}`);

    try {
      // 1. 如果需要显示横幅且通知有效
      if (showBanner && notification && !notification.isRead) {
        // 触发横幅显示事件
        notificationEvents.emit(NOTIFICATION_EVENTS.NEW_NOTIFICATION, notification);
      }

      // 2. 异步更新通知列表
      if (updateList) {
        setTimeout(() => {
          notificationEvents.emit('NOTIFICATIONS_UPDATED');
        }, 0);
      }

      // 3. 异步更新未读计数
      if (updateCount) {
        setTimeout(async () => {
          await refreshUnreadCount();
        }, 0);
      }

    } catch (error) {
      console.error(`[通知处理] 处理失败, 来源: ${source}`, error);
    }
  }, [refreshUnreadCount]); // 依赖于 refreshUnreadCount

  // 统一的批量通知处理函数（用于轮询获取多个通知）
  const handleBatchNotifications = useCallback(async (notifications, options = {}) => {
    const { 
      showBanners = false,          // 是否显示横幅
      updateList = true,            // 是否更新通知列表
      updateCount = true,           // 是否更新未读计数
      source = 'batch'              // 来源标识
    } = options;

    console.log(`[批量通知处理] 来源: ${source}, 通知数量: ${notifications?.length}, 显示横幅: ${showBanners}`);

    try {
      // 1. 如果需要显示横幅，处理最新的未读通知
      if (showBanners && notifications && notifications.length > 0) {
        const latestUnreadNotification = notifications
          .filter(n => !n.isRead)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        if (latestUnreadNotification) {
          notificationEvents.emit(NOTIFICATION_EVENTS.NEW_NOTIFICATION, latestUnreadNotification);
        }
      }

      // 2. 异步更新通知列表
      if (updateList) {
        setTimeout(() => {
          notificationEvents.emit('NOTIFICATIONS_UPDATED');
        }, 0);
      }

      // 3. 异步更新未读计数
      if (updateCount) {
        setTimeout(async () => {
          await refreshUnreadCount();
        }, 0);
      }

    } catch (error) {
      console.error(`[批量通知处理] 处理失败, 来源: ${source}`, error);
    }
  }, [refreshUnreadCount]); // 依赖于 refreshUnreadCount

  
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
    const THROTTLE_DELAY = 50;  // 节流延迟：50ms 
    const DEBOUNCE_DELAY = 100; // 防抖延迟：100ms 

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
        console.log('[Layout] 📨 收到NEW_NOTIFICATION事件:', notification);
        
        // 首先检查通知是否应该显示
        if (!notification || notification.isRead) {
          console.log('[Layout] ⚠️ 通知无效或已读，跳过横幅:', notification);
          return;
        }

        const now = Date.now();
        
        // 防止短时间内重复显示相同通知（30秒间隔）
        if (lastBannerNotificationId === notification.id && now - lastBannerTime < 30000) {
          console.log(`[Layout] 通知 ${notification.id} 在30秒内重复触发，跳过显示`);
          return;
        }

        // 检查今天横幅是否已经显示过太多次
        const today = new Date().toDateString();
        const bannerCountKey = `notification_banner_count_${notification.id}_${today}`;
        const currentCount = parseInt(localStorage.getItem(bannerCountKey) || '0');
        
        console.log(`[Layout] 检查通知 ${notification.id}: 今天横幅显示次数 ${currentCount}`);
        
        if (currentCount >= 3) {
          console.log(`[Layout] 通知 ${notification.id} 今天横幅显示次数已达上限，阻止设置横幅`);
          return;
        }

        // 检查是否是相同的通知（避免重复设置）
        if (bannerNotification && bannerNotification.id === notification.id) {
          console.log(`[Layout] 通知 ${notification.id} 已在显示中，跳过重复设置`);
          return;
        }

        // 所有检查通过，设置横幅通知
        console.log(`[Layout] 🎉 设置横幅通知: ${notification.id}`);
        setBannerNotification(notification);
        setLastBannerNotificationId(notification.id);
        setLastBannerTime(now);
        
        // 增加今日显示计数
        localStorage.setItem(bannerCountKey, String(currentCount + 1));
        console.log(`[Layout] ✅ 横幅通知已设置: ${notification.id}, 今日显示次数更新为: ${currentCount + 1}`);
      }
    );

    // 监听未读数量变化
    const unsubscribeUnreadChanged = notificationEvents.addEventListener(
      NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED,
      (count) => {
        console.log(`[Layout] 🔢 未读计数事件更新: ${count}`);
        setUnreadCount(count);
      }
    );

    // 初始化时获取未读数量（优化版本）
    const initializeUnreadCount = async () => {
      try {
        console.log('初始化未读计数...');
        await refreshUnreadCount(true); // 立即执行，不使用防抖
      } catch (e) {
        console.warn('初始化未读计数失败:', e);
      }
    };

    initializeUnreadCount();

    // 设置定期检查（获取完整通知列表，静默后台更新）
    const gentleTimer = setInterval(async () => {
      try {
        console.log('定期轮询检查通知...');
        
        // 获取完整的通知列表（而不是只获取计数）
        const res = await notificationAPI.getNotificationsByUser(user.id,{ 
          page: 1, 
          pageSize: 50 // 获取最新的50条通知用于检查
        });
        
        const serverNotifications = res?.data?.content || [];
        console.log(`轮询获取到 ${serverNotifications.length} 条服务器通知`);
        
        // 使用批量处理函数：不显示横幅 + 静默更新列表和计数
        await handleBatchNotifications(serverNotifications, {
          showBanners: false,  // 轮询不显示横幅
          updateList: true,    // 静默更新通知列表
          updateCount: true,   // 静默更新未读计数
          source: 'polling'
        });
        
      } catch (e) {
        console.debug('定期轮询检查失败:', e);
        
        // 如果获取通知列表失败，fallback到只获取未读计数
        try {
          console.log('Fallback到获取未读计数...');
          await refreshUnreadCount();
        } catch (fallbackError) {
          console.debug('Fallback获取未读计数也失败:', fallbackError);
        }
      }
    }, 30000); // 30秒轮询一次

    return () => {
      unsubscribeNewNotification();
      unsubscribeUnreadChanged();
      clearInterval(gentleTimer);
    };
  }, [bannerNotification, lastBannerNotificationId, lastBannerTime, refreshUnreadCount, handleBatchNotifications]);

  // 初始化WebSocket连接，实现实时通知
  useEffect(() => {
    console.log('[Layout] 🚀 WebSocket useEffect开始执行, user.id:', user?.id);
    console.log('[Layout] 🧪 LAYOUT组件调试标记 - 如果您看到这条消息，说明代码已更新');
    
    if (!user?.id) {
      console.log('[Layout] ⚠️ 用户ID不存在，跳过WebSocket连接');
      return;
    }

    console.log('[Layout] 正在初始化WebSocket连接...');
    
    // 连接WebSocket - 传递JWT token用于认证
    const token = localStorage.getItem('token');
    if (token) {
      console.log('[Layout] 🔗 开始连接WebSocket...');
      webSocketService.connect(user.id, token);
      console.log('[Layout] ✅ WebSocket连接命令已发送');
    } else {
      console.warn('[Layout] ❌ WebSocket连接失败：未找到JWT token');
      return;
    }

    // WebSocket通知处理：立即显示横幅 + 异步更新
    const handleNewNotification = (notification) => {
      console.log('[Layout] 🎯 WebSocket事件处理器被调用');
      console.log('[Layout] 📨 收到WebSocket实时通知:', notification);
      
      // 检查通知有效性
      if (!notification || notification.isRead) {
        console.log('[Layout] ⚠️ 通知已读或无效，跳过处理. notification:', notification);
        return;
      }

      // 检查是否为真正的新通知（避免刷新后重复处理旧通知）
      const notificationTime = new Date(notification.createdAt).getTime();
      const currentTime = Date.now();
      const timeDiff = currentTime - notificationTime;
      
      // 如果通知创建时间超过5分钟，视为旧通知，不显示横幅但仍更新列表和计数
      const isOldNotification = timeDiff > 5 * 60 * 1000; // 5分钟
      
      console.log(`[Layout] 通知时间检查: 创建时间=${notification.createdAt}, 时间差=${Math.round(timeDiff/1000)}秒, 是否为旧通知=${isOldNotification}`);
      
      // 直接处理通知，避免依赖handleNotification函数
      try {
        console.log(`[Layout] [WebSocket通知] 通知ID: ${notification?.id}, 显示横幅: ${!isOldNotification}`);

        // 1. 显示横幅（使用ref访问最新状态，避免闭包问题）
        if (!isOldNotification) {
          console.log('[Layout] 🔔 开始横幅显示检查, 通知内容:', notification);
          
          // 使用ref获取最新的横幅状态
          const currentBannerState = bannerStateRef.current;
          const now = Date.now();
          
          // 防止短时间内重复显示相同通知（30秒间隔）
          if (currentBannerState.lastBannerNotificationId === notification.id && now - currentBannerState.lastBannerTime < 30000) {
            console.log(`[Layout] 通知 ${notification.id} 在30秒内重复触发，跳过显示`);
          } else {
            // 检查今天横幅是否已经显示过太多次
            const today = new Date().toDateString();
            const bannerCountKey = `notification_banner_count_${notification.id}_${today}`;
            const currentCount = parseInt(localStorage.getItem(bannerCountKey) || '0');
            
            console.log(`[Layout] 检查通知 ${notification.id}: 今天横幅显示次数 ${currentCount}`);
            
            if (currentCount >= 3) {
              console.log(`[Layout] 通知 ${notification.id} 今天横幅显示次数已达上限，阻止设置横幅`);
            } else {
              // 检查是否是相同的通知（避免重复设置）
              if (currentBannerState.bannerNotification && currentBannerState.bannerNotification.id === notification.id) {
                console.log(`[Layout] 通知 ${notification.id} 已在显示中，跳过重复设置`);
              } else {
                // 所有检查通过，设置横幅通知
                console.log(`[Layout] 🎉 设置横幅通知: ${notification.id}`);
                setBannerNotification(notification);
                setLastBannerNotificationId(notification.id);
                setLastBannerTime(now);
                
                // 增加今日显示计数
                localStorage.setItem(bannerCountKey, String(currentCount + 1));
                console.log(`[Layout] ✅ 横幅通知已设置: ${notification.id}, 今日显示次数更新为: ${currentCount + 1}`);
              }
            }
          }
        } else {
          console.log('[Layout] ⏰ 旧通知跳过横幅显示，但仍处理列表更新');
        }

        // 2. WebSocket通知后立即从API重新获取未读计数
        console.log('[Layout] 📊 WebSocket通知后立即重新获取未读计数');
        // 直接调用refreshUnreadCount函数重新从API获取

        // 3. 异步更新通知列表
        setTimeout(() => {
          console.log('[Layout] 📝 触发通知列表更新');
          notificationEvents.emit('NOTIFICATIONS_UPDATED');
        }, 0);

                // 4. WebSocket通知后立即重新获取准确的未读计数
        const syncDelay = 300; // 稍微延迟以确保服务器已处理完通知
        setTimeout(async () => {
          console.log(`[Layout] 🔢 WebSocket通知后重新获取未读计数（${syncDelay}ms后）...`);
          try {
            await refreshUnreadCount(true); // 立即执行，不使用防抖
            console.log('[Layout] ✅ 未读计数已从API重新获取');
          } catch (e) {
            console.warn('WebSocket通知后重新获取未读计数失败:', e);
          }
        }, syncDelay);

      } catch (error) {
        console.error(`[WebSocket通知] 处理失败`, error);
      }
    };

    const handleWebSocketConnected = () => {
      console.log('[Layout] 🟢 WebSocket连接已建立，实时通知功能已启用');
    };

    const handleWebSocketDisconnected = () => {
      console.log('[Layout] 🔴 WebSocket连接已断开，将回退到轮询模式');
    };

    const handleWebSocketError = (error) => {
      console.warn('[Layout] ❌ WebSocket连接错误:', error);
    };

    // 注册WebSocket事件监听器
    console.log('[Layout] 📋 注册WebSocket事件监听器...');
    
    // 添加测试事件监听器
    const handleTestEvent = (data) => {
      console.log('[Layout] 🧪 收到测试事件:', data);
    };
    
    webSocketService.on('test', handleTestEvent);
    webSocketService.on('newNotification', handleNewNotification);
    webSocketService.on('connected', handleWebSocketConnected);
    webSocketService.on('disconnected', handleWebSocketDisconnected);
    webSocketService.on('error', handleWebSocketError);
    console.log('[Layout] ✅ WebSocket事件监听器注册完成');
    
    // 检查监听器是否正确注册
    setTimeout(() => {
      console.log('[Layout] 🔍 检查WebSocket Service监听器状态...');
      const listeners = webSocketService.getListeners();
      console.log('[Layout] 当前所有监听器:', listeners);
      console.log('[Layout] newNotification监听器数量:', listeners.has('newNotification') ? listeners.get('newNotification').length : 0);
      console.log('[Layout] test监听器数量:', listeners.has('test') ? listeners.get('test').length : 0);
      
      // 直接测试事件系统
      console.log('[Layout] 🧪 手动测试事件系统...');
      webSocketService.emit('test', { source: 'manual test from layout' });
    }, 100);

    return () => {
      // 清理WebSocket连接和监听器
      console.log('[Layout] 🧹 清理WebSocket事件监听器...');
      webSocketService.off('test', handleTestEvent);
      webSocketService.off('newNotification', handleNewNotification);
      webSocketService.off('connected', handleWebSocketConnected);
      webSocketService.off('disconnected', handleWebSocketDisconnected);
      webSocketService.off('error', handleWebSocketError);
      // 使用destroy方法完全清理（仅在组件卸载时）
      webSocketService.destroy();
      console.log('[Layout] ✅ WebSocket清理完成');
    };
  }, [user?.id]); // 只依赖user.id，避免因状态变化导致连接重建

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
          margin: '0px',
          padding: '24px',
          background: 'transparent',
          borderRadius: 0
        }}>
          <SidebarProvider collapsed={collapsed}>
            {children}
          </SidebarProvider>
        </Content>
      </Layout>
      
      {/* 通知中心 */}
      <NotificationCenter 
        userId={user.id}
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
        onUnreadChange={async () => {
          // NotificationCenter状态变化时，重新从API获取未读计数
          try {
            await refreshUnreadCount(true); // 立即执行，不使用防抖
            console.debug('[Layout] NotificationCenter变化后重新获取未读计数');
          } catch (e) {
            console.warn('NotificationCenter变化后重新获取未读计数失败:', e);
          }
        }}
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
            
            // 标记已读后重新从API获取未读计数，而不是手动计算
            if (wasUnread) {
              console.log(`通知 ${notificationId} 已标记已读，重新获取未读计数`);
              
              // 触发通知已读事件，通知其他组件（如NotificationCenter）
              notificationEvents.emit(NOTIFICATION_EVENTS.NOTIFICATION_READ, { 
                id: notificationId, 
                notification 
              });
              
              // 延迟重新获取未读计数，确保服务器已处理完成
              setTimeout(async () => {
                try {
                  await refreshUnreadCount(true); // 立即执行，不使用防抖
                  console.log(`[Layout] ✅ 通知${notificationId}标记已读后，未读计数已重新获取`);
                } catch (e) {
                  console.warn('重新获取未读计数失败:', e);
                }
              }, 200);
              
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
