import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Space, Table, Tag, message, Alert, Tooltip } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getApplicationStatusDisplayName, getApplicationStatusColor } from '../utils/statusMapping';
import { formatDateTime } from '../utils/dateFormat';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import FixedTop from '../components/FixedTop';

export default function ApplicationStatusMonitor() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    cancelled: 0,
    expired: 0,
    total: 0
  });
  const [expiringApplications, setExpiringApplications] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const { loading, error, executeWithRetry } = useApiWithRetry();

  // 获取申请状态统计
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/application-status/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('获取申请状态统计失败:', error);
      messageApi.error('获取申请状态统计失败');
    }
  };

  // 获取即将过期的申请
  const fetchExpiringApplications = async () => {
    try {
      const response = await fetch('/api/application-status/expiring-soon');
      if (response.ok) {
        const data = await response.json();
        setExpiringApplications(data);
      }
    } catch (error) {
      console.error('获取即将过期的申请失败:', error);
      messageApi.error('获取即将过期的申请失败');
    }
  };

  // 批量更新所有申请状态
  const updateAllApplicationStatuses = async () => {
    try {
      const response = await fetch('/api/application-status/update-all', {
        method: 'POST'
      });
      if (response.ok) {
        messageApi.success('所有申请状态更新成功');
        fetchStats();
        fetchExpiringApplications();
      } else {
        messageApi.error('更新申请状态失败');
      }
    } catch (error) {
      console.error('更新申请状态失败:', error);
      messageApi.error('更新申请状态失败');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchExpiringApplications();
  }, []);

  // 即将过期申请的表格列
  const expiringColumns = [
    {
      title: '申请ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '申请人',
      dataIndex: 'userNickname',
      key: 'userNickname',
      render: (text, record) => text || record.username,
    },
    {
      title: '教室',
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => formatDateTime(time),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time) => formatDateTime(time),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getApplicationStatusColor(status)}>
          {getApplicationStatusDisplayName(status)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Tooltip title="更新状态">
          <Button 
            type="text" 
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => {
              // 手动更新单个申请状态
              fetch(`/api/application-status/update/${record.id}`, {
                method: 'POST'
              }).then(() => {
                messageApi.success('申请状态更新成功');
                fetchExpiringApplications();
              }).catch(() => {
                messageApi.error('申请状态更新失败');
              });
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        <Card>
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={24}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h2 style={{ margin: 0 }}>申请状态监控</h2>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  fontWeight: 'normal',
                  backgroundColor: '#f0f0f0',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  申请记录过期后最多保留60天
                </span>
              </div>
              <p style={{ color: 'var(--text-color-secondary)' }}>
                监控申请状态，自动处理过期申请
              </p>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={4}>
              <Card>
                <Statistic
                  title="待审批"
                  value={stats.pending}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="已批准"
                  value={stats.approved}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="已驳回"
                  value={stats.rejected}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="已完成"
                  value={stats.completed}
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="已取消"
                  value={stats.cancelled}
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="已过期"
                  value={stats.expired}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={24}>
              <Card 
                title="即将过期的申请（15分钟内）" 
                extra={
                  <Space>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={fetchExpiringApplications}
                      loading={loading}
                    >
                      刷新
                    </Button>
                    <Button 
                      type="primary"
                      onClick={updateAllApplicationStatuses}
                      loading={loading}
                    >
                      批量更新状态
                    </Button>
                  </Space>
                }
              >
                {error && (
                  <Alert
                    message="数据获取失败"
                    description={String(error)}
                    type="error"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                )}

                <FixedTop>
                  <Table
                    columns={expiringColumns}
                    dataSource={expiringApplications}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
                    }}
                    size="middle"
                    scroll={{ x: 800, y: 'calc(100vh - 500px)' }}
                    overflowX='hidden'
                    sticky={{ offsetHeader: 0 }}
                  />
                </FixedTop>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card title="自动更新规则">
                <div style={{ color: 'var(--text-color)' }}>
                  <h4>申请过期规则：</h4>
                  <ul>
                    <li>超过预约开始时间15分钟：申请自动过期</li>
                    <li>预约结束时间前30分钟：申请自动过期</li>
                    <li>申请结束后24小时：申请标记为过期</li>
                  </ul>
                  
                  <h4>状态更新频率：</h4>
                  <ul>
                    <li>申请状态：每5分钟自动检查一次</li>
                    <li>教室状态：每1分钟自动检查一次</li>
                  </ul>
                  
                  <h4>手动操作：</h4>
                  <ul>
                    <li>点击"批量更新状态"可立即更新所有申请状态</li>
                    <li>点击单个申请的"更新状态"可更新该申请状态</li>
                  </ul>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </>
  );
} 