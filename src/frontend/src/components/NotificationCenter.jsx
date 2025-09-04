import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Space, Typography, Tag, Popconfirm, Drawer, Card } from 'antd';
import { CheckOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../api/notification';
import { formatRelativeTime } from '../utils/dateFormat';
import { useI18n } from '../contexts/I18nContext';
import { notificationEvents, NOTIFICATION_EVENTS } from '../utils/notificationEvents';
import isMobileFn from '../utils/isMobile';

const { Text } = Typography;

export default function NotificationCenter({ userId, visible, onClose, onUnreadChange }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  // ...existing code...
  const [deletingIds, setDeletingIds] = useState(new Set()); // 跟踪正在删除的通知ID
  const [deletingAll, setDeletingAll] = useState(false); // 跟踪全部删除状态
  const scrollContainerRef = useRef(null);
  const isMobile = isMobileFn();

  // 获取通知标题（支持国际化键）
  const getNotificationTitle = useCallback((notification) => {
    if (!notification.title) return '';
    // 如果title是翻译键格式（含有.），尝试翻译
    if (typeof notification.title === 'string' && notification.title.includes('.')) {
      const translated = t(notification.title);
      return translated !== notification.title ? translated : notification.title;
    }
    return notification.title;
  }, [t]);

  // 简单的模板字符串替换函数
  const replaceTemplate = useCallback((template, params) => {
    let result = template;
    Object.keys(params).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, params[key] || '');
    });
    return result;
  }, []);

  // 获取通知内容（支持国际化键）
  const getNotificationContent = useCallback((notification) => {
    if (!notification.content) return '';
    
    // 如果content是翻译键格式（含有.），尝试翻译
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
  }, [t, replaceTemplate]);

  // 获取全部通知（一次性，无分页）
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await notificationAPI.getNotificationsByUser(userId,{
        pageNum: 1,
        pageSize: 999999
      });
      const d = resp.data ?? resp;
      let list = [];
      if (Array.isArray(d)) list = d;
      else if (Array.isArray(d.records)) list = d.records;
      else if (Array.isArray(d.list)) list = d.list;
      else if (Array.isArray(d.rows)) list = d.rows;
      else if (typeof d === 'object' && (d.title || d.content)) list = [d];
      // 合并本地通知
      try {
        const localRaw = localStorage.getItem('localNotifications');
        if (localRaw) {
          const localList = JSON.parse(localRaw).map(item => ({ ...item, local: true }));
          const mergedMap = new Map();
          [...list, ...localList].forEach(n => { 
            if (n && n.id) {
              if (!mergedMap.has(n.id)) {
                mergedMap.set(n.id, n);
              }
            }
          });
          list = Array.from(mergedMap.values());
        }
      } catch(e) { console.warn('本地通知解析失败', e); }
      setNotifications(list);
      // 横幅逻辑（只在首次加载时）
      if (list.length > 0) {
        const unreadNotifications = list.filter(n => !n.isRead)
          .sort((a, b) => new Date(b.createTime || b.createdAt || 0) - new Date(a.createTime || a.createdAt || 0));
        if (unreadNotifications.length > 0) {
          const latestNotification = unreadNotifications[0];
          notificationEvents.emit(NOTIFICATION_EVENTS.NEW_NOTIFICATION, latestNotification);
        }
      }
    } catch (error) {
      setNotifications([]);
      console.warn('获取通知失败:', error);
    }
    setLoading(false);
  }, []);

  // 获取未读数量（直接从API，不依赖分页数据）
  const fetchUnreadCount = useCallback(async () => {
    try {
      // 获取服务器未读数量
      let serverUnread = 0;
      try {
        const response = await notificationAPI.getUnreadCountByUser(userId);
        serverUnread = response?.data?.unreadCount || 0;
        console.debug('[NotificationCenter] 服务器未读数量:', serverUnread);
      } catch (error) {
        console.warn('获取服务器未读数量失败:', error);
      }

      // 获取本地通知中的未读数量
      let localUnread = 0;
      try {
        const localRaw = localStorage.getItem('localNotifications');
        if (localRaw) {
          const localList = JSON.parse(localRaw);
          localUnread = localList.filter(n => !n.isRead).length;
        }
        console.debug('[NotificationCenter] 本地未读数量:', localUnread);
      } catch (e) {
        console.warn('获取本地未读数量失败:', e);
      }

      const totalUnread = serverUnread + localUnread;
      console.log(`[NotificationCenter] 总未读数量: ${totalUnread} (服务器: ${serverUnread} + 本地: ${localUnread})`);
      
      setUnreadCount(totalUnread);
      return totalUnread;
    } catch (error) {
      console.warn('获取未读数量失败:', error);
      return 0;
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await notificationAPI.getStatsByUser(userId);
      const total = response?.data?.total || 0;
      const unread = response?.data?.unread || 0;
      setTotal(total);
      setUnreadCount(unread);
      return { total, unread };
    } catch (error) {
      console.warn('获取通知总数和未读数量失败:', error);
      return { total: 0, unread: 0 };
    }
  }, [userId]);


  // 删除所有通知
  const handleDeleteAllNotifications = useCallback(async () => {
    if (deletingAll) return; // 防止重复点击
    
    try {
      setDeletingAll(true);
      console.log('[NotificationCenter] 开始删除所有通知');
      
      // 调用删除所有通知API
      await notificationAPI.deleteAllByUser(userId);
      
      // 清空本地通知
      localStorage.removeItem('localNotifications');
      
      // 清空通知列表和状态
      setNotifications([]);
      setUnreadCount(0);
      
      // 触发相关事件
      notificationEvents.emit(NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED, 0);
      
      console.log('[NotificationCenter] 所有通知已删除');
      
      // 通知Layout重新获取未读计数
      if (onUnreadChange) {
        onUnreadChange();
      }
      
    } catch (error) {
      console.error('删除所有通知失败:', error);
    } finally {
      setDeletingAll(false);
    }
  }, [deletingAll, onUnreadChange]);

  // 标记通知为已读
  const handleMarkAsRead = useCallback(async (notificationId) => {
    setNotifications(prev => {
      const target = prev.find(n => n.id === notificationId);
      const isLocal = target?.local;
      const alreadyRead = target?.isRead;
      
      // 先本地快速更新，提升响应速度
      const next = prev.map(item => item.id === notificationId ? { ...item, isRead: true } : item);
      
      if (!alreadyRead) {
        // 触发通知已读事件
        notificationEvents.emit(NOTIFICATION_EVENTS.NOTIFICATION_READ, { id: notificationId, notification: target });
        
        // 重新从API获取未读计数，而不是手动-1
        setTimeout(async () => {
          try {
            // 获取服务器未读数量
            const res = await notificationAPI.getUnreadCountByUser(userId);
            const serverUnread = res?.data?.unreadCount || 0;
            
            // 获取本地通知中的未读数量
            let localUnread = 0;
            try {
              const localRaw = localStorage.getItem('localNotifications');
              if (localRaw) {
                const localList = JSON.parse(localRaw);
                localUnread = localList.filter(n => !n.isRead).length;
              }
            } catch (e) {}
            
            const totalUnread = serverUnread + localUnread;
            setUnreadCount(totalUnread);
            
            // 通知其他组件未读数量变化
            notificationEvents.emit(NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED, totalUnread);
            console.debug(`[NotificationCenter] 标记已读后重新获取未读计数: ${totalUnread}`);
          } catch (e) {
            console.warn('重新获取未读计数失败:', e);
          }
        }, 100);
      }
      
      // 同步 localStorage
      try {
        const raw = localStorage.getItem('localNotifications');
        if (raw) {
          const arr = JSON.parse(raw);
          const changed = arr.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
          localStorage.setItem('localNotifications', JSON.stringify(changed));
        }
      } catch(_) {}
      
      // 若非本地再调接口（异步，不阻塞 UI）
      if (!isLocal && !alreadyRead) {
        notificationAPI.markAsRead(notificationId)
          .then(() => console.debug('标记已读成功'))
          .catch(err => console.error('标记已读失败:', err));
      }
      return next;
    });
  }, []); // 移除unreadCount依赖，通过函数式更新避免依赖问题

  // 标记所有为已读
  const handleMarkAllAsRead = async () => {
    setNotifications(prev => {
      const anyServerUnread = prev.some(n => !n.local && !n.isRead);
      const next = prev.map(item => ({ ...item, isRead: true }));
      
      // 重新从API获取未读计数，而不是直接设置为0
      setTimeout(async () => {
        try {
          // 获取服务器未读数量
          const res = await notificationAPI.getUnreadCountByUser(userId);
          const serverUnread = res?.data?.unreadCount || 0;
          
          // 获取本地通知中的未读数量
          let localUnread = 0;
          try {
            const localRaw = localStorage.getItem('localNotifications');
            if (localRaw) {
              const localList = JSON.parse(localRaw);
              localUnread = localList.filter(n => !n.isRead).length;
            }
          } catch (e) {}
          
          const totalUnread = serverUnread + localUnread;
          setUnreadCount(totalUnread);
          
          // 通知其他组件未读数量变化
          notificationEvents.emit(NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED, totalUnread);
          console.debug(`[NotificationCenter] 标记全部已读后重新获取未读计数: ${totalUnread}`);
        } catch (e) {
          console.warn('重新获取未读计数失败:', e);
        }
      }, 100);
      
      try {
        const raw = localStorage.getItem('localNotifications');
        if (raw) {
          const arr = JSON.parse(raw).map(n => ({ ...n, isRead: true }));
          localStorage.setItem('localNotifications', JSON.stringify(arr));
        }
      } catch(_) {}
      if (anyServerUnread) {
        notificationAPI.markAllAsReadByUser(userId)
          .then(() => console.debug('标记全部已读成功'))
          .catch(err => console.error('标记全部已读失败:', err));
      }
      return next;
    });
  };

  // 删除通知
  const handleDeleteNotification = async (notificationId) => {
    // 防重复点击：检查是否正在删除
    if (deletingIds.has(notificationId)) {
      console.debug('通知正在删除中，忽略重复操作:', notificationId);
      return;
    }

    // 标记为正在删除
    setDeletingIds(prev => new Set(prev).add(notificationId));
    
    try {
      setNotifications(prev => {
        const target = prev.find(n => n.id === notificationId);
        
        // 如果通知已经被删除了，直接返回
        if (!target) {
          console.debug('通知已不存在，跳过删除:', notificationId);
          return prev;
        }
        
        const isLocal = target.local;
        const wasUnread = target && !target.isRead;
        const next = prev.filter(item => item.id !== notificationId);
        
        if (wasUnread) {
          // 重新从API获取未读计数，而不是手动-1
          setTimeout(async () => {
            try {
              // 获取服务器未读数量
              const res = await notificationAPI.getUnreadCountByUser(userId);
              const serverUnread = res?.data?.unreadCount || 0;
              
              // 获取本地通知中的未读数量
              let localUnread = 0;
              try {
                const localRaw = localStorage.getItem('localNotifications');
                if (localRaw) {
                  const localList = JSON.parse(localRaw);
                  localUnread = localList.filter(n => !n.isRead).length;
                }
              } catch (e) {}
              
              const totalUnread = serverUnread + localUnread;
              setUnreadCount(totalUnread);
              
              // 通知其他组件未读数量变化
              notificationEvents.emit(NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED, totalUnread);
              console.debug(`[NotificationCenter] 删除通知后重新获取未读计数: ${totalUnread}`);
            } catch (e) {
              console.warn('重新获取未读计数失败:', e);
            }
          }, 100);
        }
        
        // 触发通知删除事件
        notificationEvents.emit(NOTIFICATION_EVENTS.NOTIFICATION_DELETED, { id: notificationId, notification: target });
        
        try {
          const raw = localStorage.getItem('localNotifications');
          if (raw) {
            const arr = JSON.parse(raw).filter(n => n.id !== notificationId);
            localStorage.setItem('localNotifications', JSON.stringify(arr));
          }
        } catch(_) {}
        
        // 后台删除服务器端通知（如果不是本地通知）
        if (!isLocal) {
          notificationAPI.deleteNotification(notificationId)
            .then(() => console.debug('删除通知成功:', notificationId))
            .catch(err => {
              console.error('删除通知失败:', err);
              // 删除失败时可能需要回滚界面状态，但这里先保持简单处理
            })
            .finally(() => {
              // 无论成功失败，都要移除删除标记
              setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
              });
            });
        } else {
          // 本地通知直接移除删除标记
          setDeletingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(notificationId);
            return newSet;
          });
        }
        
        return next;
      });
    } catch (error) {
      console.error('删除通知时发生错误:', error);
      // 出错时移除删除标记
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // 智能路由导航函数
  const handleNotificationClick = useCallback((notification) => {
    // 首先标记为已读
    handleMarkAsRead(notification.id);
    
    // 关闭通知中心
    if (onClose) {
      onClose();
    }
    
    // 智能路由分析
    const title = getNotificationTitle(notification).toLowerCase();
    const content = getNotificationContent(notification).toLowerCase();
    const fullText = `${title} ${content}`;
    
    // 密码安全相关通知
    if (fullText.includes('密码') || fullText.includes('password') || fullText.includes('弱密码') || 
        fullText.includes('安全') || fullText.includes('security') || fullText.includes('强度')) {
      navigate('/profile/change-password');
      return;
    }
    
    // 房间相关通知
    if (fullText.includes('房间') || fullText.includes('room') || fullText.includes('申请') || 
        fullText.includes('application') || fullText.includes('预订') || fullText.includes('booking')) {
      navigate('/rooms');
      return;
    }
    
    // 用户相关通知
    if (fullText.includes('用户') || fullText.includes('user') || fullText.includes('个人') || 
        fullText.includes('profile') || fullText.includes('账户') || fullText.includes('account')) {
      navigate('/profile');
      return;
    }
    
    // 系统相关通知
    if (fullText.includes('系统') || fullText.includes('system') || fullText.includes('维护') || 
        fullText.includes('maintenance') || fullText.includes('升级') || fullText.includes('upgrade')) {
      navigate('/');
      return;
    }
    
    // 默认导航到首页
    navigate('/');
  }, [navigate, onClose, handleMarkAsRead, getNotificationTitle, getNotificationContent]);

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

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'normal': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  // 初始化加载
  useEffect(() => {
    const initializeData = async () => {
      console.log('[NotificationCenter] 初始化数据加载');
      await fetchNotifications();
      await fetchStats();
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  // 组件显示时刷新数据
  useEffect(() => {
    if (visible) {
      console.log('[NotificationCenter] 组件显示，刷新数据');
      fetchNotifications(); // 重新获取通知列表
      fetchStats(); // 重新获取未读计数
    }
  }, [visible, fetchNotifications, fetchStats]);

  // 监听外部通知已读事件（如横幅通知被标记为已读）
  useEffect(() => {
    const handleExternalNotificationRead = ({ id, notification }) => {
      console.log(`[NotificationCenter] 接收到外部通知已读事件: ${id}`);
      
      // 更新本地通知状态
      setNotifications(prev => {
        const targetIndex = prev.findIndex(n => n.id === id);
        if (targetIndex === -1) {
          console.log(`[NotificationCenter] 通知 ${id} 不在当前列表中，跳过更新`);
          return prev;
        }
        
        const target = prev[targetIndex];
        if (target.isRead) {
          console.log(`[NotificationCenter] 通知 ${id} 已经是已读状态`);
          return prev;
        }
        
        const updated = [...prev];
        updated[targetIndex] = { ...target, isRead: true };
        
        // 重新计算未读数量
        const newUnreadCount = updated.filter(n => !n.isRead).length;
        
        console.log(`[NotificationCenter] 外部已读事件处理完成，新未读数量: ${newUnreadCount}`);
        
        // 更新未读计数状态
        setUnreadCount(newUnreadCount);
        
        // 触发未读数量变化事件（延迟执行避免冲突）
        setTimeout(() => {
          notificationEvents.emit(NOTIFICATION_EVENTS.UNREAD_COUNT_CHANGED, newUnreadCount);
        }, 100);
        
        return updated;
      });
    };

    // 监听外部通知已读事件
    const unsubscribe = notificationEvents.addEventListener(
      NOTIFICATION_EVENTS.NOTIFICATION_READ,
      handleExternalNotificationRead
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 每次抽屉开启时刷新一次（避免仅首挂载请求）
  useEffect(() => {
    if (visible) {
      const refreshData = async () => {
        console.log('[NotificationCenter] 打开通知中心，刷新数据');
        await fetchNotifications();
      };
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]); // 只依赖visible状态

  useEffect(() => {
    if (typeof onUnreadChange === 'function') {
      onUnreadChange(unreadCount);
    }
  }, [unreadCount, onUnreadChange]);

  // 卡片样式渲染
  const renderNotificationCard = (item) => {
    return (
      <Card
        key={item.id}
        size="small"
        className="notification-card"
        style={{
          borderRadius: 8,
          borderColor: item.isRead ? 'var(--border-color)' : '#1677ff55',
          background: item.isRead ? 'var(--bg-color)' : 'var(--component-bg)',
          boxShadow: item.isRead ? 'none' : '0 2px 6px -2px rgba(0,0,0,0.08)',
          opacity: item.isRead ? 0.4 : 1,
          cursor: 'pointer'
        }}
        onClick={() => handleNotificationClick(item)}
        title={
          <Space size={6} wrap>
            <Text strong={!item.isRead}>{getNotificationTitle(item)}</Text>
            <Tag color={getNotificationTypeColor(item.type)}>{getNotificationTypeName(item.type)}</Tag>
            {item.priority !== 'normal' && (
              <Tag color={getPriorityColor(item.priority)}>
                {item.priority === 'urgent' ? t('notification.priority.urgent') :
                  item.priority === 'high' ? t('notification.priority.high') :
                  item.priority === 'low' ? t('notification.priority.low') : t('notification.priority.normal')}
              </Tag>
            )}
            {item.local && <Tag color="gold">{t('notification.localTag')}</Tag>}
          </Space>
        }
        extra={
          <Space size={4} style={{ alignItems: 'center' }}>
            {!item.isRead && (
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(item.id); }}
                title={t('notification.actions.markRead')}
                style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
              />
            )}
            <Popconfirm
              title={t('notification.confirmDelete.title')}
              onConfirm={(e) => { 
                e?.stopPropagation?.(); 
                // 再次检查是否正在删除，防止重复操作
                if (!deletingIds.has(item.id)) {
                  handleDeleteNotification(item.id); 
                }
              }}
              okText={t('notification.confirmDelete.ok')}
              cancelText={t('notification.confirmDelete.cancel')}
              onPopupClick={e => e.stopPropagation()}
              disabled={deletingIds.has(item.id)}
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
                loading={deletingIds.has(item.id)}
                disabled={deletingIds.has(item.id)}
                title={deletingIds.has(item.id) ? t('notification.actions.deleting') : t('notification.actions.delete')}
                onClick={e => e.stopPropagation()}
                style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
              />
            </Popconfirm>
          </Space>
        }
        headStyle={{
          padding: '8px 12px',
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center'
        }}
  bodyStyle={{ padding: '2px 12px 10px 12px' }}
        hoverable
      >
        <div style={{ fontSize: 12, color: 'var(--text-color-secondary)', whiteSpace: 'pre-wrap' }}>{getNotificationContent(item)}</div>
        <div style={{ marginTop: 6, textAlign: 'right' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>{formatRelativeTime(item.timestamp)}</Text>
        </div>
      </Card>
    );
  };



  const isMobileStyle = typeof window !== 'undefined' && window.innerWidth <= 768&& isMobile;
  return (
  <Drawer
    title={t('notification.title')}
    placement={isMobileStyle ? 'top' : 'right'}
    width={isMobileStyle ? '100vw' : 400}
    
    open={visible}
    onClose={onClose}
    extra={
      <Space>
        <Button
          type="text"
          size="small"
          onClick={() => { fetchNotifications(); fetchStats(); }}
          loading={loading}
        >{t('notification.refresh')}</Button>
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
          >
            {t('notification.markAllRead')}
          </Button>
        )}
        {notifications.length > 0 && (
          <Popconfirm
            title={t('notification.deleteAll.confirm', '确定要删除所有通知吗？')}
            description={t('notification.deleteAll.description', '此操作无法撤销')}
            onConfirm={handleDeleteAllNotifications}
            okText={t('common.confirm', '确定')}
            cancelText={t('common.cancel', '取消')}
            disabled={deletingAll}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<ClearOutlined />}
              loading={deletingAll}
              disabled={deletingAll}
            >
              {t('notification.deleteAll.button', '全部删除')}
            </Button>
          </Popconfirm>
        )}
      </Space>
    }
  >
    <div 
      ref={scrollContainerRef}
      style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }} 
      className="custom-scrollbar"
    >
      {notifications.length > 0 ? (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {notifications.map(renderNotificationCard)}
        </Space>
      ) : (
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center',
          color: 'var(--text-color-secondary)'
        }}>
          {loading ? t('notification.loading') : t('notification.empty')}
        </div>
      )}
    </div>
      
      {notifications.length > 0 && (
        <div style={{
          padding: '8px 0',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          marginTop: '16px'
        }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {t('notification.footer.totalPrefix','共')} {total} {t('notification.footer.totalSuffix','条通知')}
            {unreadCount > 0 && `，${unreadCount} ${t('notification.footer.unreadSuffix','条未读')}`}
          </Text>
        </div>
      )}
    </Drawer>
  );
} 