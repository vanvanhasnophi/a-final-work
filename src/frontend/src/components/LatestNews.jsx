import React from 'react';
import { List, Tag, Typography, Space, Empty } from 'antd';
import { getActionDisplayName, getActionColor } from '../utils/footprintTypes';
import { formatTime } from '../utils/dateFormat';

const { Text } = Typography;

export default function LatestNews({ 
  footprints = [], 
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

  if (!footprints || footprints.length === 0) {
    return (
      <Empty 
        description={emptyText}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ padding: '20px 0' }}
      />
    );
  }

  const displayFootprints = footprints.slice(0, maxItems);

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
        dataSource={displayFootprints}
        renderItem={(footprint) => (
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
                  color={getActionColor(footprint.action)}
                  style={{ margin: 0, fontSize: '12px' }}
                >
                  {getActionDisplayName(footprint.action)}
                </Tag>
                <Text strong style={{ fontSize: '14px' }}>
                  {footprint.attach || '系统动态'}
                </Text>
              </div>
              {footprint.tempInfo && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {footprint.tempInfo}
                </Text>
              )}
            </Space>
          </div>
          <div style={{ marginLeft: '12px', textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {formatTime(footprint.timestamp)}
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