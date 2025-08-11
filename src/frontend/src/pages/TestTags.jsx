import React from 'react';
import { Card, Space, Tag, Typography } from 'antd';
import { useTheme } from '../contexts/ThemeContext';

const { Title, Paragraph } = Typography;

export default function TestTags() {
  const { isDarkMode } = useTheme();

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Tag配色测试">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>当前主题: {isDarkMode ? '深色模式' : '浅色模式'}</Title>
            <Paragraph>
              使用Ant Design官方建议的配色方案，提供更好的对比度
            </Paragraph>
          </div>

          <div>
            <Title level={5}>教室状态标签</Title>
            <Space wrap>
              <Tag color="success">空闲</Tag>
              <Tag color="warning">使用中</Tag>
              <Tag color="processing">已预约</Tag>
              <Tag color="error">维护中</Tag>
              <Tag color="error">清洁中</Tag>
            </Space>
          </div>

          <div>
            <Title level={5}>申请状态标签</Title>
            <Space wrap>
              <Tag color="processing">待审批 (PENDING)</Tag>
              <Tag color="success">已批准 (APPROVED)</Tag>
              <Tag color="error">已拒绝 (REJECTED)</Tag>
              <Tag color="warning">已取消 (CANCELLED)</Tag>
              <Tag color="default">已完成 (COMPLETED)</Tag>
              <Tag color="default">已过期 (EXPIRED)</Tag>
            </Space>
          </div>

          <div>
            <Title level={5}>用户角色标签</Title>
            <Space wrap>
              <Tag color="processing">APPLIER</Tag>
              <Tag color="processing">APPROVER</Tag>
              <Tag color="warning">MAINTAINER</Tag>
              <Tag color="processing">SERVICE</Tag>
              <Tag color="error">ADMIN</Tag>
            </Space>
          </div>

          <div>
            <Title level={5}>活动状态标签</Title>
            <Space wrap>
              <Tag color="success">已完成</Tag>
              <Tag color="processing">已批准</Tag>
              <Tag color="warning">进行中</Tag>
            </Space>
          </div>

          <div>
            <Title level={5}>所有官方颜色</Title>
            <Space wrap>
              <Tag color="default">default</Tag>
              <Tag color="processing">processing</Tag>
              <Tag color="success">success</Tag>
              <Tag color="error">error</Tag>
              <Tag color="warning">warning</Tag>
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
} 