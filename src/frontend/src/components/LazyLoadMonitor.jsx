import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Badge, Button, Space } from 'antd';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { preloadStatus } from '../utils/preloadUtils';

/**
 * 懒加载性能监控组件
 * 仅在开发环境显示
 */
const LazyLoadMonitor = () => {
  const [stats, setStats] = useState({ totalPreloaded: 0, preloadedKeys: [] });
  const [visible, setVisible] = useState(false);

  const refreshStats = () => {
    setStats(preloadStatus.getStats());
  };

  useEffect(() => {
    refreshStats();
    // 定期刷新统计数据
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // 仅在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!visible) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          opacity: 0.7,
        }}
      >
        <Button
          type="primary"
          shape="circle"
          icon={<EyeOutlined />}
          onClick={() => setVisible(true)}
          title="显示懒加载监控"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 350,
        zIndex: 1000,
        opacity: 0.95,
      }}
    >
      <Card
        title={
          <Space>
            <span>懒加载监控</span>
            <Badge count={stats.totalPreloaded} />
          </Space>
        }
        size="small"
        extra={
          <Space>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={refreshStats}
              size="small"
            />
            <Button
              type="text"
              onClick={() => setVisible(false)}
              size="small"
            >
              隐藏
            </Button>
          </Space>
        }
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="预加载组件数">
            <Tag color="blue">{stats.totalPreloaded}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="已加载组件">
            <div style={{ maxHeight: 120, overflowY: 'auto' }}>
              <Space wrap>
                {stats.preloadedKeys.map((key) => (
                  <Tag key={key} color="green" style={{ margin: '2px 0' }}>
                    {key}
                  </Tag>
                ))}
              </Space>
              {stats.preloadedKeys.length === 0 && (
                <span style={{ color: '#999', fontSize: '12px' }}>
                  暂无预加载组件
                </span>
              )}
            </div>
          </Descriptions.Item>
        </Descriptions>
        
        <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
          * 仅在开发环境显示
        </div>
      </Card>
    </div>
  );
};

export default LazyLoadMonitor;
