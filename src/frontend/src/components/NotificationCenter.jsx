import React, { useState, useEffect, useCallback } from 'react';
import { Button, Space, Typography, Tag, Popconfirm, Drawer, Card } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { notificationAPI } from '../api/notification';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { formatRelativeTime } from '../utils/dateFormat';

const { Text } = Typography;

export default function NotificationCenter({ visible, onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { executeWithRetry } = useApiWithRetry();

  // 获取通知列表
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const parseRecords = (resp) => {
      if (!resp) return [];
      const d = resp.data ?? resp;
      if (!d) return [];
      if (Array.isArray(d)) return d;
      if (Array.isArray(d.records)) return d.records;
      if (Array.isArray(d.list)) return d.list;
      if (Array.isArray(d.rows)) return d.rows;
      // 常见分页结构 { data: { records: [...], total: X } } 已在上方覆盖
      // 若返回对象自身就是单条通知，包装成数组
      if (typeof d === 'object' && (d.title || d.content)) return [d];
      return [];
    };
    let remoteList = [];
    let triedAltPage = false;
    let triedPageParam = false;
    let triedNoParam = false;
    try {
      const response = await executeWithRetry(
        async () => notificationAPI.getNotifications({ pageNum: 1, pageSize: 20 }),
        { errorMessage: '获取通知失败', maxRetries: 0 }
      );
      remoteList = parseRecords(response);
      // 如果第一页为空，尝试 pageNum=0 兼容后端从0开始计数
      if (remoteList.length === 0) {
        try {
          const altResp = await notificationAPI.getNotifications({ pageNum: 0, pageSize: 20 });
          const alt = parseRecords(altResp);
          if (alt.length > 0) {
            remoteList = alt;
            triedAltPage = true;
          }
        } catch(_) {}
      }
      // 尝试使用 page 参数命名
      if (remoteList.length === 0) {
        try {
          const pageResp = await notificationAPI.getNotifications({ page: 1, size: 20 });
          const pageList = parseRecords(pageResp);
            if (pageList.length > 0) {
              remoteList = pageList;
              triedPageParam = true;
            }
        } catch(_) {}
      }
      // 尝试无分页参数（某些后端返回全量或默认第一页）
      if (remoteList.length === 0) {
        try {
          const noParamResp = await notificationAPI.getNotifications();
          const noParamList = parseRecords(noParamResp);
          if (noParamList.length > 0) {
            remoteList = noParamList;
            triedNoParam = true;
          }
        } catch(_) {}
      }
      console.debug('[NotificationCenter] 远程通知数量:', remoteList.length, 'altPageUsed=', triedAltPage);
      if (remoteList.length === 0) {
        console.debug('[NotificationCenter] 备用尝试 flags => altPage:', triedAltPage, 'pageParam:', triedPageParam, 'noParam:', triedNoParam);
      }
    } catch (error) {
      console.warn('远程通知获取失败，使用本地缓存: ', error);
    }

    // 合并本地缓冲（弱密码或其它本地注入）
    try {
      const localRaw = localStorage.getItem('localNotifications');
      if (localRaw) {
        const localList = JSON.parse(localRaw).map(item => ({ ...item, local: true }));
        const mergedMap = new Map();
        // 先放远程再放本地，使本地覆盖、保留本地 isRead 状态
        [...remoteList, ...localList].forEach(n => { if (!mergedMap.has(n.id)) mergedMap.set(n.id, n); });
        remoteList = Array.from(mergedMap.values());
        console.debug('[NotificationCenter] 合并本地临时通知数量:', localList.length);
      }
    } catch(e) { console.warn('本地通知解析失败', e); }

    setNotifications(remoteList);
    const computedUnread = remoteList.filter(n => !n.isRead).length;
    setUnreadCount(computedUnread);
    setLoading(false);
  }, [executeWithRetry]);

  // 获取未读数量
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await executeWithRetry(
        async () => {
          const result = await notificationAPI.getUnreadCount();
          return result;
        },
        {
          errorMessage: '获取未读数量失败',
          maxRetries: 0,
          showRetryMessage: false
        }
      );
      
      if (response?.data) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  }, [executeWithRetry]);

  // 标记通知为已读
  const handleMarkAsRead = async (notificationId) => {
    setNotifications(prev => {
      const target = prev.find(n => n.id === notificationId);
      const isLocal = target?.local;
      const alreadyRead = target?.isRead;
      // 先本地快速更新，提升响应速度
      const next = prev.map(item => item.id === notificationId ? { ...item, isRead: true } : item);
      if (!alreadyRead) setUnreadCount(u => Math.max(0, u - 1));
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
        executeWithRetry(
          async () => { await notificationAPI.markAsRead(notificationId); return true; },
          { errorMessage: '标记已读失败', successMessage: '已标记为已读' }
        ).catch(err => { console.error('标记已读失败:', err); });
      }
      return next;
    });
  };

  // 标记所有为已读
  const handleMarkAllAsRead = async () => {
    setNotifications(prev => {
      const anyServerUnread = prev.some(n => !n.local && !n.isRead);
      const next = prev.map(item => ({ ...item, isRead: true }));
      setUnreadCount(0);
      try {
        const raw = localStorage.getItem('localNotifications');
        if (raw) {
          const arr = JSON.parse(raw).map(n => ({ ...n, isRead: true }));
          localStorage.setItem('localNotifications', JSON.stringify(arr));
        }
      } catch(_) {}
      if (anyServerUnread) {
        executeWithRetry(
          async () => { await notificationAPI.markAllAsRead(); return true; },
          { errorMessage: '标记全部已读失败', successMessage: '已全部标记为已读' }
        ).catch(err => console.error('标记全部已读失败:', err));
      }
      return next;
    });
  };

  // 删除通知
  const handleDeleteNotification = async (notificationId) => {
    setNotifications(prev => {
      const target = prev.find(n => n.id === notificationId);
      const isLocal = target?.local;
      const wasUnread = target && !target.isRead;
      const next = prev.filter(item => item.id !== notificationId);
      if (wasUnread) setUnreadCount(u => Math.max(0, u - 1));
      try {
        const raw = localStorage.getItem('localNotifications');
        if (raw) {
          const arr = JSON.parse(raw).filter(n => n.id !== notificationId);
          localStorage.setItem('localNotifications', JSON.stringify(arr));
        }
      } catch(_) {}
      if (!isLocal) {
        executeWithRetry(
          async () => { await notificationAPI.deleteNotification(notificationId); return true; },
          { errorMessage: '删除通知失败', successMessage: '通知已删除' }
        ).catch(err => console.error('删除通知失败:', err));
      }
      return next;
    });
  };

  // 获取通知类型颜色
  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'system': return 'blue';
      case 'application': return 'green';
      case 'room': return 'orange';
      case 'user': return 'purple';
      default: return 'default';
    }
  };

  // 获取通知类型显示名称
  const getNotificationTypeName = (type) => {
    switch (type) {
      case 'system': return '系统';
      case 'application': return '申请';
      case 'room': return '教室';
      case 'user': return '用户';
      default: return '通知';
    }
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
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // 每次抽屉开启时刷新一次（避免仅首挂载请求）
  useEffect(() => {
    if (visible) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [visible, fetchNotifications, fetchUnreadCount]);

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
          opacity: item.isRead ? 0.75 : 1
        }}
        title={
          <Space size={6} wrap>
            <Text strong={!item.isRead}>{item.title}</Text>
            <Tag color={getNotificationTypeColor(item.type)}>{getNotificationTypeName(item.type)}</Tag>
            {item.priority !== 'normal' && (
              <Tag color={getPriorityColor(item.priority)}>
                {item.priority === 'urgent' ? '紧急' :
                  item.priority === 'high' ? '重要' :
                  item.priority === 'low' ? '普通' : '正常'}
              </Tag>
            )}
            {item.local && <Tag color="gold">本地</Tag>}
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
                title="标记为已读"
                style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
              />
            )}
            <Popconfirm
              title="确定要删除这条通知吗？"
              onConfirm={(e) => { e?.stopPropagation?.(); handleDeleteNotification(item.id); }}
              okText="确定"
              cancelText="取消"
              onPopupClick={e => e.stopPropagation()}
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
                title="删除通知"
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
        <div style={{ fontSize: 12, color: 'var(--text-color-secondary)', whiteSpace: 'pre-wrap' }}>{item.content}</div>
        <div style={{ marginTop: 6, textAlign: 'right' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>{formatRelativeTime(item.timestamp)}</Text>
        </div>
      </Card>
    );
  };



  return (
    <Drawer
      title="通知中心"
      placement="right"
      width={400}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          <Button
            type="text"
            size="small"
            onClick={() => { fetchNotifications(); fetchUnreadCount(); }}
            loading={loading}
          >刷新</Button>
          {unreadCount > 0 && (
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleMarkAllAsRead}
            >
              全部已读
            </Button>
          )}
        </Space>
      }
    >
              <div style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }} className="custom-scrollbar">
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
            {loading ? '加载中…' : '暂无通知'}
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
            共 {notifications.length} 条通知
            {unreadCount > 0 && `，${unreadCount} 条未读`}
          </Text>
        </div>
      )}
    </Drawer>
  );
} 