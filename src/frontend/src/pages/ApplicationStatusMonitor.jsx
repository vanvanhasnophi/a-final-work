import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Space, Table, Tag, message, Alert, Tooltip } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getApplicationStatusDisplayName, getApplicationStatusColor } from '../utils/statusMapping';
import { formatDateTime } from '../utils/dateFormat';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import FixedTop from '../components/FixedTop';
import ResponsiveButton from '../components/ResponsiveButton';
import { useI18n } from '../contexts/I18nContext';

export default function ApplicationStatusMonitor() {
  const { t } = useI18n();
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
  messageApi.error(t('applicationStatus.errors.fetchStatsFail', '获取申请状态统计失败'));
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
  messageApi.error(t('applicationStatus.errors.fetchExpiringFail', '获取即将过期的申请失败'));
    }
  };

  // 批量更新所有申请状态
  const updateAllApplicationStatuses = async () => {
    try {
      const response = await fetch('/api/application-status/update-all', {
        method: 'POST'
      });
      if (response.ok) {
  messageApi.success(t('applicationStatus.messages.updateAllSuccess', '所有申请状态更新成功'));
        fetchStats();
        fetchExpiringApplications();
      } else {
  messageApi.error(t('applicationStatus.messages.updateAllFail', '更新申请状态失败'));
      }
    } catch (error) {
  console.error('更新申请状态失败:', error);
  messageApi.error(t('applicationStatus.messages.updateAllFail', '更新申请状态失败'));
    }
  };

  useEffect(() => {
    fetchStats();
    fetchExpiringApplications();
  }, []);

  // 即将过期申请的表格列
  const expiringColumns = [
    {
      title: t('applicationStatus.columns.id', '申请ID'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('applicationManagement.columns.applicant'),
      dataIndex: 'userNickname',
      key: 'userNickname',
      render: (text, record) => text || record.username,
    },
    {
      title: t('applicationManagement.columns.roomName'),
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
      title: t('applicationManagement.descriptions.startTime'),
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => formatDateTime(time),
    },
    {
      title: t('applicationManagement.descriptions.endTime'),
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time) => formatDateTime(time),
    },
    {
      title: t('applicationManagement.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const displayName = getApplicationStatusDisplayName(status);
        const color = getApplicationStatusColor(status);
        
        // 如果是过期状态，显示原状态和过期标签
        if (status === 'EXPIRED' && record.originalStatus) {
          const originalDisplayName = getApplicationStatusDisplayName(record.originalStatus);
          const originalColor = getApplicationStatusColor(record.originalStatus);
          return (
            <div>
              <Tag color={originalColor}>{originalDisplayName}</Tag>
              <Tag color="default" style={{ marginTop: 2 }}>{displayName}</Tag>
            </div>
          );
        }
        
        return <Tag color={color}>{displayName}</Tag>;
      },
    },
    {
      title: t('applicationManagement.columns.actions'),
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Tooltip title={t('applicationStatus.actions.updateStatus', '更新状态')}>
          <Button 
            type="text" 
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => {
              // 手动更新单个申请状态
              fetch(`/api/application-status/update/${record.id}`, {
                method: 'POST'
              }).then(() => {
                messageApi.success(t('applicationStatus.messages.updateOneSuccess', '申请状态更新成功'));
                fetchExpiringApplications();
              }).catch(() => {
                messageApi.error(t('applicationStatus.messages.updateOneFail', '申请状态更新失败'));
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
                <h2 style={{ margin: 0 }}>{t('applicationStatus.title', '申请状态监控')}</h2>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  fontWeight: 'normal',
                  backgroundColor: '#f0f0f0',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {t('applicationManagement.badgeRetention')}
                </span>
              </div>
              <p style={{ color: 'var(--text-color-secondary)' }}>
                {t('applicationStatus.subtitle', '监控申请状态，自动处理过期申请')}
              </p>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={4}>
              <Card>
                <Statistic
                  title={t('applicationManagement.statusOptions.PENDING')}
                  value={stats.pending}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title={t('applicationManagement.statusOptions.APPROVED')}
                  value={stats.approved}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title={t('applicationManagement.statusOptions.REJECTED')}
                  value={stats.rejected}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title={t('applicationManagement.statusOptions.COMPLETED')}
                  value={stats.completed}
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title={t('applicationManagement.statusOptions.CANCELLED')}
                  value={stats.cancelled}
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title={t('applicationManagement.statusOptions.EXPIRED')}
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
                title={t('applicationStatus.expiringTitle', '即将过期的申请（15分钟内）')} 
                extra={
                  <Space>
                    <ResponsiveButton 
                      icon={<ReloadOutlined />} 
                      onClick={fetchExpiringApplications}
                      loading={loading}
                    >
                      {t('common.refresh', '刷新')}
                    </ResponsiveButton>
                    <ResponsiveButton 
                      type="primary"
                      onClick={updateAllApplicationStatuses}
                      loading={loading}
                    >
                      {t('applicationStatus.actions.updateAll', '批量更新状态')}
                    </ResponsiveButton>
                  </Space>
                }
              >
                {error && (
                  <Alert
                    message={t('applicationManagement.error.dataFetchTitle', '数据获取失败')}
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
                      showTotal: (total, range) => {
                        const template = t('applicationManagement.paginationTotal') || t('roomList.paginationTotal');
                        return (template || '第 {from}-{to} 条/共 {total} 条')
                          .replace('{from}', String(range[0]))
                          .replace('{to}', String(range[1]))
                          .replace('{total}', String(total));
                      }
                    }}
                    size="middle"
                    scroll={{ x: 800, y: 'calc(100vh - 500px)' }}
                    sticky={{ offsetHeader: 0 }}
                  />
                </FixedTop>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card title={t('applicationStatus.rulesTitle', '自动更新规则')}>
                <div style={{ color: 'var(--text-color)' }}>
                  <h4>{t('applicationStatus.rules.expirationTitle', '申请过期规则：')}</h4>
                  <ul>
                    <li>{t('applicationStatus.rules.expiration.items.item1', '超过预约开始时间15分钟：申请自动过期')}</li>
                    <li>{t('applicationStatus.rules.expiration.items.item2', '预约结束时间前30分钟：申请自动过期')}</li>
                    <li>{t('applicationStatus.rules.expiration.items.item3', '申请结束后24小时：申请标记为过期')}</li>
                  </ul>
                  
                  <h4>{t('applicationStatus.rules.frequencyTitle', '状态更新频率：')}</h4>
                  <ul>
                    <li>{t('applicationStatus.rules.frequency.items.item1', '申请状态：每5分钟自动检查一次')}</li>
                    <li>{t('applicationStatus.rules.frequency.items.item2', '教室状态：每1分钟自动检查一次')}</li>
                  </ul>
                  
                  <h4>{t('applicationStatus.rules.manualTitle', '手动操作：')}</h4>
                  <ul>
                    <li>{t('applicationStatus.rules.manual.items.item1', '点击"批量更新状态"可立即更新所有申请状态')}</li>
                    <li>{t('applicationStatus.rules.manual.items.item2', '点击单个申请的"更新状态"可更新该申请状态')}</li>
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