import React from 'react';
import { List, Tag, Typography, Space, Empty } from 'antd';
import { getActivityTypeDisplayName, getActivityTypeColor } from '../utils/activityTypes';
import { formatTime } from '../utils/dateFormat';

const { Text } = Typography;

export default function LatestNews({ 
  activities = [], 
  loading = false, 
  maxItems = 6,
  emptyText = "暂无最新动态",
  height = "250px",
  minHeight = "200px"
}) {
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Text type="secondary">加载中...</Text>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Empty 
        description={emptyText}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ padding: '20px 0' }}
      />
    );
  }

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div style={{ 
      height: height, 
      minHeight: minHeight,
      marginTop: '-20px',
      marginLeft: '-16px',
      marginRight: '-16px',
      marginBottom: '-24px'
    }}
    className="custom-scrollbar"
    >
      <List
        dataSource={displayActivities}
        renderItem={(activity) => (
        <List.Item
          style={{
            padding: '12px 0',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: 1 }}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag 
                  color={getActivityTypeColor(activity.type)}
                  style={{ margin: 0, fontSize: '12px' }}
                >
                  {getActivityTypeDisplayName(activity.type)}
                </Tag>
                <Text strong style={{ fontSize: '14px' }}>
                  {activity.description || '系统活动'}
                </Text>
              </div>
              {activity.user && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {activity.user}
                </Text>
              )}
            </Space>
          </div>
          <div style={{ marginLeft: '12px', textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {formatTime(activity.timestamp)}
            </Text>
          </div>
        </List.Item>
      )}
      style={{
        padding: '16px'
      }}
      />
    </div>
  );
} 