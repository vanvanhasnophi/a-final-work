import React, { useState, useEffect, useCallback } from 'react';
import { List, Button, Space, Typography, Tag, Popconfirm, Drawer } from 'antd';
import { CheckOutlined, DeleteOutlined, ReadOutlined } from '@ant-design/icons';
import { notificationAPI } from '../api/notification';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { formatRelativeTime } from '../utils/dateFormat';

const { Text } = Typography;

export default function NotificationCenter({ visible, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { executeWithRetry } = useApiWithRetry();

  // 获取通知列表
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await executeWithRetry(
        async () => {
          const result = await notificationAPI.getNotifications({
            pageNum: 1,
            pageSize: 20
          });
          return result;
        },
        {
          errorMessage: '获取通知失败',
          maxRetries: 0
        }
      );
      
      if (response?.data) {
        setNotifications(response.data.records || []);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
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
    try {
      await executeWithRetry(
        async () => {
          await notificationAPI.markAsRead(notificationId);
          return true;
        },
        {
          errorMessage: '标记已读失败',
          successMessage: '已标记为已读'
        }
      );
      
      // 更新本地状态
      setNotifications(prev => 
        prev.map(item => 
          item.id === notificationId ? { ...item, isRead: true } : item
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记所有为已读
  const handleMarkAllAsRead = async () => {
    try {
      await executeWithRetry(
        async () => {
          await notificationAPI.markAllAsRead();
          return true;
        },
        {
          errorMessage: '标记全部已读失败',
          successMessage: '已全部标记为已读'
        }
      );
      
      // 更新本地状态
      setNotifications(prev => 
        prev.map(item => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  // 删除通知
  const handleDeleteNotification = async (notificationId) => {
    try {
      await executeWithRetry(
        async () => {
          await notificationAPI.deleteNotification(notificationId);
          return true;
        },
        {
          errorMessage: '删除通知失败',
          successMessage: '通知已删除'
        }
      );
      
      // 更新本地状态
      setNotifications(prev => 
        prev.filter(item => item.id !== notificationId)
      );
      
      // 如果删除的是未读通知，减少未读数量
      const deletedNotification = notifications.find(item => item.id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    }
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
      case 'room': return '房间';
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

  // 通知列表项渲染
  const renderNotificationItem = (item) => (
    <List.Item
      key={item.id}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: item.isRead ? 'transparent' : 'var(--component-bg)',
        opacity: item.isRead ? 0.7 : 1
      }}
      actions={[
        !item.isRead && (
          <Button
            type="text"
            size="small"
            icon={<ReadOutlined />}
            onClick={() => handleMarkAsRead(item.id)}
            title="标记为已读"
          />
        ),
        <Popconfirm
          title="确定要删除这条通知吗？"
          onConfirm={() => handleDeleteNotification(item.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            danger
            title="删除通知"
          />
        </Popconfirm>
      ].filter(Boolean)}
    >
      <List.Item.Meta
        title={
          <Space>
            <Text strong={!item.isRead} style={{ color: 'var(--text-color)' }}>
              {item.title}
            </Text>
            <Tag color={getNotificationTypeColor(item.type)} size="small">
              {getNotificationTypeName(item.type)}
            </Tag>
            {item.priority !== 'normal' && (
              <Tag color={getPriorityColor(item.priority)} size="small">
                {item.priority === 'urgent' ? '紧急' : 
                 item.priority === 'high' ? '重要' : 
                 item.priority === 'low' ? '普通' : '正常'}
              </Tag>
            )}
          </Space>
        }
        description={
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {item.content}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {formatRelativeTime(item.timestamp)}
            </Text>
          </div>
        }
      />
    </List.Item>
  );



  return (
    <Drawer
      title="通知中心"
      placement="right"
      width={400}
      open={visible}
      onClose={onClose}
      extra={
        unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
          >
            全部已读
          </Button>
        )
      }
    >
      <div style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
        {notifications.length > 0 ? (
          <List
            dataSource={notifications}
            renderItem={renderNotificationItem}
            loading={loading}
            locale={{
              emptyText: (
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center',
                  color: 'var(--text-color-secondary)'
                }}>
                  暂无通知
                </div>
              )
            }}
          />
        ) : (
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center',
            color: 'var(--text-color-secondary)'
          }}>
            暂无通知
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