import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Dropdown, List, Button, Space, Typography, Tag, message, Popconfirm } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ReadOutlined } from '@ant-design/icons';
import { notificationAPI } from '../api/notification';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { formatDateTime, formatRelativeTime } from '../utils/dateFormat';

const { Text } = Typography;

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

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

  // 通知面板内容
  const notificationPanel = (
    <div style={{
      width: 400,
      maxHeight: 500,
      backgroundColor: 'var(--component-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      boxShadow: 'var(--shadow)'
    }}>
      {/* 面板头部 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Text strong style={{ color: 'var(--text-color)' }}>
          通知中心
        </Text>
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
      </div>

      {/* 通知列表 */}
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
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

      {/* 面板底部 */}
      {notifications.length > 0 && (
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            共 {notifications.length} 条通知
            {unreadCount > 0 && `，${unreadCount} 条未读`}
          </Text>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={notificationPanel}
      trigger={['click']}
      placement="bottomRight"
      arrow
      open={visible}
      onOpenChange={setVisible}
    >
      <Badge count={unreadCount} size="small" offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            background: 'var(--component-bg)',
          }}
          title="通知中心"
        />
      </Badge>
    </Dropdown>
  );
} 