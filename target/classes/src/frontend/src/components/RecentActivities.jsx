import React from 'react';
import { List, Tag, Space, Typography, Empty } from 'antd';
import { formatDateTime, formatRelativeTime } from '../utils/dateFormat';
import { 
  getActivityTypeDisplayName, 
  getActivityTypeColor, 
  generateActivityDescription 
} from '../utils/activityTypes';

const { Text } = Typography;

export default function RecentActivities({ 
  activities = [], 
  loading = false, 
  emptyText = "暂无最近活动",
  maxItems = 10,
  showAvatar = true,
  showTime = true,
  showType = true,
  compact = false,
  height = "400px",
  minHeight = "200px"
}) {
  // 限制显示的活动数量
  const displayActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <List
        loading={true}
        dataSource={[]}
        renderItem={() => null}
      />
    );
  }

  if (!displayActivities || displayActivities.length === 0) {
    return (
      <Empty 
        description={emptyText}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div style={{ 
      height: height, 
      minHeight: minHeight,
      marginTop: '-20px',
      marginLeft: '-20px',
      marginRight: '-20px',
      marginBottom: '-24px'
    }}
    className="custom-scrollbar"
    >
      <List
        dataSource={displayActivities}
        renderItem={(activity) => (
        <List.Item
          style={{
            padding: compact ? '8px 0' : '12px 0',
            borderBottom: compact ? 'none' : '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: 1 }}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text strong style={{ fontSize: compact ? '13px' : '14px' }}>
                  {generateActivityDescription(activity)}
                </Text>
                {showType && (
                  <Tag 
                    color={getActivityTypeColor(activity.type)}
                    size={compact ? 'small' : 'default'}
                  >
                    {getActivityTypeDisplayName(activity.type)}
                  </Tag>
                )}
              </div>
              {activity.description && (
                <Text type="secondary" style={{ fontSize: compact ? '11px' : '12px' }}>
                  {activity.description}
                </Text>
              )}
            </Space>
          </div>
          {showTime && activity.timestamp && (
            <div style={{ marginLeft: '12px', textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: compact ? '10px' : '12px' }}>
                {formatRelativeTime(activity.timestamp)}
              </Text>
            </div>
          )}
        </List.Item>
      )}
      style={{
        padding: compact ? '8px' : '16px'
      }}
      />
    </div>
  );
} 