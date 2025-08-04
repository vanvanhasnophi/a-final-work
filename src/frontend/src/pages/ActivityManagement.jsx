import React, { useState } from 'react';
import { Card, Row, Col, Select, Button, Space, Tag, Typography } from 'antd';
import { ReloadOutlined, ClearOutlined } from '@ant-design/icons';
import RecentActivities from '../components/RecentActivities';
import { useActivities } from '../hooks/useActivities';
import ActivityGenerator from '../utils/activityGenerator';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;
const { Title } = Typography;

export default function ActivityManagement() {
  const { user } = useAuth();
  const [activityType, setActivityType] = useState('all');
  const [activityLimit, setActivityLimit] = useState(20);

  // 使用活动Hook
  const { 
    activities, 
    loading, 
    error,
    clearActivities,
    refreshActivities 
  } = useActivities({
    type: activityType,
    userId: user?.id,
    userRole: user?.role,
    limit: activityLimit,
    autoRefresh: false
  });

  // 生成测试活动
  const generateTestActivities = () => {
    const testUser = {
      id: user?.id || 1,
      username: user?.username || 'testuser',
      nickname: user?.nickname || '测试用户'
    };

    const testApplication = {
      id: Date.now(),
      roomName: '测试会议室',
      roomId: 1,
      reason: '测试申请'
    };

    const testRoom = {
      id: Date.now(),
      name: '测试教室'
    };

    // 生成不同类型的测试活动
    ActivityGenerator.applicationCreated(testApplication, testUser);
    ActivityGenerator.applicationApproved(testApplication, testUser);
    ActivityGenerator.roomCreated(testRoom, testUser);
    ActivityGenerator.userUpdated(testUser);
    ActivityGenerator.systemMaintenance({ description: '系统定期维护' });

    // 刷新活动列表
    setTimeout(() => {
      refreshActivities();
    }, 100);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Title level={3}>活动管理</Title>
            <p style={{ color: 'var(--text-color-secondary)' }}>
              查看和管理系统中的所有活动记录
            </p>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Select
              placeholder="选择活动类型"
              value={activityType}
              onChange={setActivityType}
              style={{ width: '100%' }}
            >
              <Option value="all">全部活动</Option>
              <Option value="user">用户活动</Option>
              <Option value="application">申请活动</Option>
              <Option value="room">教室活动</Option>
              <Option value="system">系统活动</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="显示数量"
              value={activityLimit}
              onChange={setActivityLimit}
              style={{ width: '100%' }}
            >
              <Option value={10}>10条</Option>
              <Option value={20}>20条</Option>
              <Option value={50}>50条</Option>
              <Option value={100}>100条</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={refreshActivities}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                icon={<ClearOutlined />} 
                onClick={clearActivities}
                danger
              >
                清空活动
              </Button>
              <Button 
                type="primary"
                onClick={generateTestActivities}
              >
                生成测试活动
              </Button>
            </Space>
          </Col>
        </Row>

        {error && (
          <div style={{ marginBottom: '16px' }}>
            <Tag color="red">错误: {error}</Tag>
          </div>
        )}

        <RecentActivities
          activities={activities}
          loading={loading}
          maxItems={activityLimit}
          showAvatar={true}
          showTime={true}
          showType={true}
          compact={false}
          emptyText="暂无活动记录"
          height="calc(100vh - 400px)"
          minHeight="300px"
        />
      </Card>
    </div>
  );
} 