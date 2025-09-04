import React from 'react';
import { List, Tag, Space, Typography, Empty } from 'antd';
import { formatRelativeTime } from '../utils/dateFormat';
import { 
  getActionDisplayName, 
  getActionColor, 
  formatFootprintDescription 
} from '../utils/footprintTypes';

const { Text } = Typography;

export default function RecentFootprints({ 
  footprints = [], 
  loading = false, 
  emptyText = "暂无最近动态",
  maxItems = 10,
  showAvatar = true,
  showTime = true,
  showType = true,
  compact = false,
  height = "400px",
  minHeight = "200px"
}) {
  // 限制显示的动态数量
  const displayFootprints = footprints.slice(0, maxItems);

  if (loading) {
    return (
      <List
        loading={true}
        dataSource={[]}
        renderItem={() => null}
      />
    );
  }

  if (!displayFootprints || displayFootprints.length === 0) {
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
        dataSource={displayFootprints}
        renderItem={(footprint) => (
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
                  {formatFootprintDescription(footprint)}
                </Text>
                {showType && (
                  <Tag 
                    color={getActionColor(footprint.action)}
                    size={compact ? 'small' : 'default'}
                  >
                    {getActionDisplayName(footprint.action)}
                  </Tag>
                )}
              </div>
              {footprint.attach && (
                <Text type="secondary" style={{ fontSize: compact ? '11px' : '12px' }}>
                  {footprint.attach}
                </Text>
              )}
            </Space>
          </div>
          {showTime && footprint.timestamp && (
            <div style={{ marginLeft: '12px', textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: compact ? '10px' : '12px' }}>
                {formatRelativeTime(footprint.timestamp)}
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