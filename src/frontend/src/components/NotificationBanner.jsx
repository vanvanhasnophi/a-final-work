import React, { useState, useEffect, useContext } from 'react';
import { BlurContext } from '../App';
import { Button, Tag } from 'antd';
import { BellOutlined, CloseOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';

const NotificationBanner = ({ 
  notification, 
  onClose, 
  onViewNotifications,
  onMarkAsRead,
  onCollapseNotificationCenter,
  style = {} 
}) => {
  // 桌面端拖拽关闭横幅
  const [dragging, setDragging] = useState(false);
  // 拖拽事件处理
  const handleAnimationEnd = () => setDragging(true);

  const { t } = useI18n();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const enableMoreBlur = useContext(BlurContext);
  // 控制消失动画

  // 判断是否为移动端（需最前面声明，供所有事件处理用）
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const [leaving, setLeaving] = useState(false);
  // 移动端向上拖动消失
  const [DragY, setDragY] = useState(0);
  const dragThreshold = 25; // 拖动超过此距离自动关闭

  // 移动端拖拽事件
  const handleMobileTouchStart = (e) => {
    if (!isMobile) return;
    setDragging(true);
    setDragY(0);
    if (e.touches && e.touches[0]) {
      e.target.dataset.startY = e.touches[0].clientY;
    }
  };
  const handleMobileTouchMove = (e) => {
    if (!dragging || !isMobile) return;
    let clientY = e.touches[0].clientY;
    let startY = Number(e.currentTarget.dataset.startY || 0);
    // 只允许向上拖动
    const deltaY = Math.min(0, clientY - startY);
    setDragY(deltaY);
  };
  const handleMobileTouchEnd = (e) => {
    if (!isMobile) return;
    if (Math.abs(DragY) > dragThreshold) {
      setLeaving(true);
      setTimeout(handleClose, 350);
    }
    setDragging(false);
    setDragY(0);
  };
  useEffect(() => {
    if (!visible) setLeaving(true);
  }, [visible]);
  
  // 初始化shouldShow状态 - 立即检查是否应该显示
  const [shouldShow, setShouldShow] = useState(() => {
    if (!notification) return false;
    
    const today = new Date().toDateString();
    const bannerCountKey = `notification_banner_count_${notification.id}_${today}`;
    const currentCount = parseInt(localStorage.getItem(bannerCountKey) || '0');
    
    const canShow = currentCount < 3;
    console.log(`通知 ${notification.id} 初始检查: 今天显示 ${currentCount} 次, 可以显示: ${canShow}`);
    
    return canShow;
  });

  // 开发模式下：清理所有通知计数的工具函数（仅在开发环境使用）
  const clearNotificationCounts = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('notification_banner_count_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('已清理所有通知横幅计数');
  };

  // 开发模式下：在控制台暴露清理函数
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.clearNotificationCounts = clearNotificationCounts;
    }
  }, []);

  // 当通知ID变化时重新检查是否应该显示
  useEffect(() => {
    if (!notification) {
      setShouldShow(false);
      return;
    }

    const today = new Date().toDateString();
    const bannerCountKey = `notification_banner_count_${notification.id}_${today}`;
    const currentCount = parseInt(localStorage.getItem(bannerCountKey) || '0');
    
    const canShow = currentCount < 3;
    console.log(`Notification ${notification.id}: 今天横幅已显示 ${currentCount} 次, 可以显示: ${canShow}`);
    
    setShouldShow(canShow);
    
    // 清理旧的计数记录（保留最近7天）
    if (canShow) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`notification_banner_count_${notification.id}_`)) {
          const dateStr = key.split('_').pop();
          const recordDate = new Date(dateStr);
          if (recordDate < sevenDaysAgo) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  }, [notification]);

  // 只有在横幅真正开始显示时增加计数（防抖机制）
  useEffect(() => {
    if (notification && shouldShow && visible) {
      const today = new Date().toDateString();
      const bannerCountKey = `notification_banner_count_${notification.id}_${today}`;
      
      // 使用定时器防抖，确保只在真正显示时计数
      const timer = setTimeout(() => {
        const currentCount = parseInt(localStorage.getItem(bannerCountKey) || '0');
        localStorage.setItem(bannerCountKey, (currentCount + 1).toString());
        console.log(`通知 ${notification.id} 横幅显示次数已更新为: ${currentCount + 1}`);
      }, 100); // 100ms 延迟，避免快速重复
      
      return () => clearTimeout(timer);
    }
  }, [notification, shouldShow, visible]); // 添加完整的notification依赖

  // 自动关闭计时器和进度条
  useEffect(() => {
    if (!visible) return; // 如果已经不可见，不启动计时器
    
    const duration = 12000; // 12秒 - 给用户更多时间阅读
    const interval = 50; // 每50ms更新一次进度
    const step = 100 / (duration / interval);
    
    const progressTimer = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          const next = prev - step;
          if (next <= 0) {
            setVisible(false);
            setTimeout(() => {
              if (onClose) {
                onClose();
              }
            }, 300);
            return 0;
          }
          return next;
        });
      }
    }, interval);

    return () => {
      clearInterval(progressTimer);
    };
  }, [onClose, isPaused, visible]); // 添加 visible 依赖项

  // 提前返回：如果没有通知或不应该显示，直接不渲染

  if (!notification || !shouldShow) return null;
  if (!visible) return null;


  const handleClose = () => {
    setVisible(false);
    // 延迟调用onClose，让退出动画完成
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  // 根据通知类型跳转到对应页面
  const handleNotificationClick = async () => {
    if (!notification) return;
    if (isMobile) {
      if (onViewNotifications) onViewNotifications();
      return;
    }
    // ...existing code for桌面端跳转...
    console.log(`点击横幅通知: ${notification.id}`);
    // 首先标记通知为已读
    if (onMarkAsRead && notification.id && !notification.isRead) {
      try {
        await onMarkAsRead(notification.id);
        console.log(`横幅通知 ${notification.id} 已标记为已读`);
      } catch (error) {
        console.error('标记横幅通知已读失败:', error);
      }
    }
    const notificationType = notification.type || '';
    const notificationContent = (notification.content || '').toLowerCase();
    const notificationTitle = (notification.title || '').toLowerCase();
    const searchText = (notificationContent + ' ' + notificationTitle).toLowerCase();
    try {
      // 根据通知类型或内容判断跳转页面
      if (notificationType === 'security' || 
          searchText.includes('密码') || 
          searchText.includes('password') ||
          searchText.includes('安全')) {
        // 安全相关通知跳转到密码修改页面
        navigate('/profile/change-password');
      } else if (notificationType === 'application' || 
                 searchText.includes('申请') || 
                 searchText.includes('application') ||
                 searchText.includes('审批') ||
                 searchText.includes('approval')) {
        // 申请相关通知跳转到申请管理页面  
        navigate('/applications');
      } else if (notificationType === 'room' || 
                 searchText.includes('房间') || 
                 searchText.includes('room') ||
                 searchText.includes('会议室')) {
        // 房间相关通知跳转到房间管理页面
        navigate('/rooms');
      } else if (notificationType === 'user' || 
                 searchText.includes('用户') || 
                 searchText.includes('user') ||
                 searchText.includes('账户') ||
                 searchText.includes('account')) {
        // 用户相关通知跳转到用户管理页面
        navigate('/users');
      } else {
        // 默认跳转到仪表板
        navigate('/dashboard');
      }
      // 折叠通知中心
      if (onCollapseNotificationCenter) {
        onCollapseNotificationCenter();
      }
      // 跳转后关闭通知
      handleClose();
    } catch (error) {
      console.error('通知跳转失败:', error);
    }
  };

  // 获取通知标题（支持国际化键）
  const getNotificationTitle = (notification) => {
    if (!notification.title) return '';
    if (typeof notification.title === 'string' && notification.title.includes('.')) {
      const translated = t(notification.title);
      return translated !== notification.title ? translated : notification.title;
    }
    return notification.title;
  };

  // 简单的模板字符串替换函数
  const replaceTemplate = (template, params) => {
    let result = template;
    Object.keys(params).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, params[key] || '');
    });
    return result;
  };

  // 获取通知内容（支持国际化键和参数替换）
  const getNotificationContent = (notification) => {
    if (!notification.content) return '';
    
    if (typeof notification.content === 'string' && notification.content.includes('.')) {
      // 检查是否包含参数（用|分隔）
      const parts = notification.content.split('|');
      const key = parts[0];
      const params = parts.slice(1);
      
      const translated = t(key);
      if (translated !== key) {
        // 如果翻译成功，处理参数替换
        if (params.length > 0) {
          // 根据不同的通知类型处理参数
          if (key.includes('application.approved.content')) {
            const [applicationTitle, reason] = params;
            const template = t('notification.application.approved.message');
            const reasonText = reason ? (t('common.reason') + ': ' + reason) : '';
            return replaceTemplate(template, { 
              title: applicationTitle, 
              reason: reasonText
            });
          } else if (key.includes('application.rejected.content')) {
            const [applicationTitle, reason] = params;
            const template = t('notification.application.rejected.message');
            const reasonText = reason ? (t('common.reason') + ': ' + reason) : '';
            return replaceTemplate(template, { 
              title: applicationTitle, 
              reason: reasonText
            });
          } else if (key.includes('room.statusChange.content')) {
            const [roomName, oldStatus, newStatus] = params;
            const template = t('notification.room.statusChange.message');
            return replaceTemplate(template, { 
              roomName, 
              oldStatus, 
              newStatus 
            });
          } else if (key.includes('system.maintenance.content')) {
            const [maintenanceInfo] = params;
            const template = t('notification.system.maintenance.message');
            return replaceTemplate(template, { 
              info: maintenanceInfo
            });
          }
        }
        return translated;
      }
    }
    return notification.content;
  };

  const getAlertColor = () => {
    switch (notification.priority) {
      case 'urgent':
      case 'high':
        return {
          iconColor: '#ff7875'
        };
      case 'low':
        return {
          iconColor: '#1677ff'
        };
      default:
        return {
          iconColor: '#1677ff'
        };
    }
  };

  const colors = getAlertColor();

  // 获取通知类型颜色
  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'system': return 'blue';
      case 'application': return 'green';
      case 'room': return 'orange';
      case 'user': return 'purple';
      case 'security': return 'red';
      default: return 'default';
    }
  };

  // 获取通知类型显示名称
  const getNotificationTypeName = (type) => {
    return t(`notification.type.${type}`) || t('notification.type.default');
  };
  
  // 受全局模糊设置控制的亚克力效果样式
  const acrylicStyle = {
    backgroundColor: enableMoreBlur ? 'var(--component-bg-allow-blur)' : 'var(--component-bg)',
    backdropFilter: enableMoreBlur ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: enableMoreBlur ? 'blur(20px)' : 'none', // Safari支持
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
  };


  return (isMobile) ? (
      <div
        style={{
          position: 'fixed',
          top: 78 + DragY,
          left: 12,
          right: 12,
          zIndex: 998, // header一般999
          borderRadius: 16,
          background: enableMoreBlur ? 'var(--component-bg-allow-blur)' : 'var(--component-bg)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.18)',
          padding: '10px 16px 10px 12px',
          display: 'flex',
          alignItems: 'center',
          minHeight: 48,
          maxWidth: 'calc(100vw - 24px)',
          overflow: 'hidden',
          transition: dragging ? 'none' : 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          backdropFilter: enableMoreBlur ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: enableMoreBlur ? 'blur(16px)' : 'none',
          animation: leaving
            ? 'slideUpBannerBlur 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            : 'slideDownBannerBlur 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: DragY ? Math.max(0.2, 1 + DragY / 80) : 1,
          touchAction: 'none',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
      >
        {/* 触摸层 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            background: 'transparent',
            borderRadius: 16,
          }}
          data-start-y={0}
          onTouchStart={handleMobileTouchStart}
          onTouchMove={handleMobileTouchMove}
          onTouchEnd={handleMobileTouchEnd}
          onTouchCancel={handleMobileTouchEnd}
          onClick={handleNotificationClick}
        />
        <BellOutlined style={{ fontSize: 18, color: '#ff7875', marginRight: 8, flexShrink: 0 }} />
        <span
          style={{
            fontWeight: 600,
            fontSize: 15,
            lineHeight: '1.4',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            marginRight: 8
          }}
        >
          {getNotificationTitle(notification)}
        </span>
        
        <style>{`
          @keyframes slideDownBannerBlur {
            from {
              transform: translateY(-40px);
              opacity: 0;
              backdrop-filter: blur(0px);
              -webkit-backdrop-filter: blur(0px);
            }
            to {
              transform: translateY(0);
              opacity: 1;
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
            }
          }
          @keyframes slideUpBannerBlur {
            from {
              transform: translateY(0);
              opacity: 1;
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
            }
            to {
              transform: translateY(-40px);
              opacity: 0;
              backdrop-filter: blur(0px);
              -webkit-backdrop-filter: blur(0px);
            }
          }
        `}</style>
      </div>
    ) : (
    <div
      style={{
        position: 'fixed',
        top: 8, // 不遮挡header，header高度一般为56px
        left: 'auto',
        right: 8,
        width: 'auto',
        zIndex: 9999,
        maxWidth: '380px',
        minWidth:  '320px',
        animation: leaving
          ? 'slideOutToRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          : 'slideInFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        style={{
          ...acrylicStyle,
          position: 'relative',
          borderRadius: isMobile ? '0 0 12px 12px' : '12px',
          padding: isMobile ? '10px 12px' : '12px 16px',
          boxShadow: isMobile
            ? '0 2px 12px rgba(0,0,0,0.08)'
            : (isDarkMode 
                ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
                : '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.02)'),
          color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onMouseEnter={(e) => {
          setIsPaused(true);
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isDarkMode 
              ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)' 
              : '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03)';
          }
        }}
        onMouseLeave={(e) => {
          setIsPaused(false);
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDarkMode 
              ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
              : '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.02)';
          }
        }}
        onClick={handleNotificationClick}
      >
        {/* 头部 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <BellOutlined 
              style={{ 
                fontSize: '16px', 
                color: colors.iconColor,
                marginRight: '8px',
                flexShrink: 0
              }} 
            />
            <span style={{ 
              fontWeight: '600',
              fontSize: '14px',
              lineHeight: '1.4',
              wordBreak: 'break-word'
            }}>
              {getNotificationTitle(notification)}
            </span>
          </div>
          <Button
            type="text"
            size="small"
            icon={<ArrowRightOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // 防止触发通知点击事件
              handleClose();
            }}
            title={t('notificationBanner.dismiss', '关闭通知')}
            style={{ 
              marginLeft: '8px',
              minWidth: 'auto',
              padding: '4px',
              height: '24px',
              width: '24px',
              borderRadius: '6px',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.45)',
              backgroundColor: 'transparent',
              border: 'none',
              flexShrink: 0,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.color = isDarkMode 
                ? 'rgba(255, 255, 255, 0.8)' 
                : 'rgba(0, 0, 0, 0.65)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = isDarkMode 
                ? 'rgba(255, 255, 255, 0.6)' 
                : 'rgba(0, 0, 0, 0.45)';
            }}
          />
        </div>
        
        {/* 内容 */}
        <div style={{ 
          fontSize: '13px',
          lineHeight: '1.5',
          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.65)',
          marginLeft: '24px',
          wordBreak: 'break-word',
          marginBottom: '8px'
        }}>
          {getNotificationContent(notification)}
        </div>
        
        {/* 类型标签 */}
        {notification.type && (
          <div style={{ 
            marginLeft: '24px',
            marginBottom: '4px'
          }}>
            <Tag 
              color={getNotificationTypeColor(notification.type)}
              size="small"
              style={{ 
                fontSize: '11px',
                borderRadius: '4px'
              }}
            >
              {getNotificationTypeName(notification.type)}
            </Tag>
          </div>
        )}
        
        
        
        {/* 自动关闭进度条 */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '2px',
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            transition: 'width 0.05s linear',
            opacity: 0.8
          }} />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%) scale(0.95);
            opacity: 0;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }
        }
        @keyframes slideOutToRight {
          from {
            transform: translateX(0) scale(1);
            opacity: 1;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }
          to {
            transform: translateX(100%) scale(0.95);
            opacity: 0;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
        }
        @media (max-width: 768px) {
          .notification-banner-mobile {
            width: 100vw !important;
            left: 0 !important;
            right: 0 !important;
            border-radius: 0 0 12px 12px !important;
            top: 56px !important;
            max-width: 100vw !important;
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBanner;
