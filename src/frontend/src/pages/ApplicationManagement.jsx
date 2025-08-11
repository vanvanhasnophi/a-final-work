import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Table, Card, Button, Space, Form, Input, DatePicker, Select, 
  message, Alert, Tag, Pagination, Result, Drawer, Descriptions, 
  Divider, Tooltip 
} from 'antd';
import { 
  EyeOutlined, ReloadOutlined, 
  CheckOutlined, UndoOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import FixedTop from '../components/FixedTop';

import { 
  canViewAllApplications, canViewOwnApplications, canApproveApplication, 
  canCancelApplication
} from '../utils/permissionUtils';
import { getRoleDisplayName } from '../utils/roleMapping';
import { applicationAPI } from '../api/application';
import { formatDateTime, formatTimeRange } from '../utils/dateFormat';
import { getApplicationStatusDisplayName, getApplicationStatusColor } from '../utils/statusMapping';
import { useI18n } from '../contexts/I18nContext';
import { useDebounceSearchV2 } from '../hooks/useDebounceSearchV2';
import { getUserDisplayName } from '../utils/userDisplay';

const { Option } = Select;

export default function ApplicationManagement() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState({
    pageNum: 1,
    pageSize: 10,
  });
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [authError, setAuthError] = useState(null);
  
  // 筛选控件状态
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const datePickerRef = useRef(null);
  const statusSelectRef = useRef(null);
  
  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'detail', 'approve', 'cancel'
  const [currentApplication, setCurrentApplication] = useState(null);
  

  
  const { loading: applicationsLoading, error: applicationsError, executeWithRetry: executeApplications } = useApiWithRetry();
  
  // 防抖搜索Hook
  const roomSearch = useDebounceSearchV2((value) => {
    const newParams = { roomName: value || undefined, pageNum: 1 };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchApplications(newParams);
  }, 500);
  
  const applicantSearch = useDebounceSearchV2((value) => {
    const newParams = { username: value || undefined, pageNum: 1 };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchApplications(newParams);
  }, 500);
  
  // 页面刷新Hook
  const handlePageRefresh = usePageRefresh(() => {
    fetchApplications();
  });

  // 获取申请列表
  const fetchApplications = useCallback(async (params = {}) => {
    const result = await executeApplications(
      async () => {
        const currentSearchParams = searchParams;
        const requestParams = {
          ...currentSearchParams,
          ...params,
        };
        
        console.log('发送申请分页请求参数:', requestParams);
        const response = await applicationAPI.getApplicationList(requestParams);
        
        const { records, total, pageNum, pageSize } = response.data;
        console.log('申请分页响应数据:', response.data);
        
        setApplications(records || []);
        setPagination({
          current: pageNum || 1,
          pageSize: pageSize || 10,
          total: total || 0,
        });
        
        setAuthError(null);
        
        return response.data;
      },
      {
        errorMessage: t('applicationManagement.error.fetchListFail'),
        maxRetries: 0,
        retryDelay: 0,
        onError: (error) => {
          if (error.response?.status === 401) {
            setAuthError(t('applicationManagement.auth.tokenExpired'));
            messageApi.error(t('applicationManagement.auth.tokenExpired'));
          } else if (error.response?.status === 403) {
            setAuthError(t('applicationManagement.auth.forbidden'));
            messageApi.error(t('applicationManagement.auth.forbidden'));
          }
        }
      }
    );
    return result;
  }, [executeApplications, searchParams, messageApi]);

  // 初始化加载
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // 处理表格分页变化
  const handleTableChange = (pagination, filters, sorter) => {
    console.log('申请表格分页变化:', pagination);
    const newParams = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchApplications(newParams);
  };

  // 打开详情抽屉
  const handleViewDetail = (record) => {
    setDrawerType('detail');
    setCurrentApplication(record);
    setDrawerVisible(true);
  };

  // 打开审批抽屉
  const handleApprove = (record) => {
    setDrawerType('approve');
    setCurrentApplication(record);
    form.resetFields();
    setDrawerVisible(true);
  };

  // 打开撤销抽屉
  const handleCancel = (record) => {
    setDrawerType('cancel');
    setCurrentApplication(record);
    form.resetFields();
    setDrawerVisible(true);
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setDrawerType('');
    setCurrentApplication(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (drawerType === 'approve') {
        await executeApplications(
          async () => {
            const approvalData = {
              applicationId: currentApplication.id,
              approved: values.approved,
              reason: values.reason
            };
            const response = await applicationAPI.approveApplication(approvalData);
            messageApi.success(values.approved 
              ? t('applicationManagement.messages.approveApproved')
              : t('applicationManagement.messages.approveRejected')
            );
            handleCloseDrawer();
            fetchApplications();
            return response;
          },
          {
            errorMessage: t('applicationManagement.messages.approveFail'),
            successMessage: t('applicationManagement.messages.approveSuccess')
          }
        );
      } else if (drawerType === 'cancel') {
        await executeApplications(
          async () => {
            const cancelData = {
              applicationId: currentApplication.id,
              reason: values.reason
            };
            const response = await applicationAPI.cancelApplication(cancelData);
            messageApi.success(t('applicationManagement.messages.cancelSuccess'));
            handleCloseDrawer();
            fetchApplications();
            return response;
          },
          {
            errorMessage: t('applicationManagement.messages.cancelFail'),
            successMessage: t('applicationManagement.messages.cancelSuccess')
          }
        );
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  // 权限检查
  const canView = canViewAllApplications(user?.role) || canViewOwnApplications(user?.role);
  const canApprove = canApproveApplication(user?.role);
  const canCancel = canCancelApplication(user?.role);

  // 如果用户没有权限，显示权限不足页面
  if (!canView) {
    return (
      <div style={{ padding: '24px' }}>
        <Result
          status="403"
          title="403"
      subTitle={t('applicationManagement.auth.result403Subtitle')}
          extra={
            <div>
        <p>{t('applicationManagement.auth.result403RolePrefix')}{getRoleDisplayName(user?.role)}</p>
        <p>{t('applicationManagement.auth.result403NeedRole')}</p>
            </div>
          }
        />
      </div>
    );
  }

  // 如果有认证错误，显示错误页面
  if (authError) {
    return (
      <div style={{ padding: '24px' }}>
        <Result
          status="error"
      title={t('applicationManagement.auth.resultErrorTitle')}
          subTitle={authError}
          extra={[
            <Button key="back" onClick={() => window.history.back()}>
        {t('applicationManagement.actions.back')}
            </Button>,
            <Button key="login" type="primary" onClick={() => window.location.href = '/login'}>
        {t('applicationManagement.actions.login')}
            </Button>
          ]}
        />
      </div>
    );
  }

  const columns = [
    {
  title: t('applicationManagement.columns.roomName'),
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
  title: t('applicationManagement.columns.applicant'),
      dataIndex: 'userNickname',
      key: 'userNickname',
      render: (userNickname, record) => {
        // 优先显示nickname，如果不存在则显示username
        return getUserDisplayName({ nickname: userNickname, username: record.username });
      },
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
  title: t('applicationManagement.columns.usageTime'),
      key: 'time',
      onCell: () => ({ 'data-field': 'timeRange' }),
      render: (_, record) => {
        const r = formatTimeRange(record.startTime, record.endTime, { structured: true });
        if (r.crossDay) {
          return (
            <div className="num-mono" data-field="timeRange">
              <div>{r.startFormatted} -</div>
              <div>{r.endFormatted}</div>
            </div>
          );
        }
        return <div className="num-mono" data-field="timeRange">{r.text || r}</div>;
      },
    },
    {
  title: t('applicationManagement.columns.reason'),
      dataIndex: 'reason',
      key: 'reason',
    },
    {
  title: t('applicationManagement.columns.createTime'),
      dataIndex: 'createTime',
      key: 'createTime',
      onCell: () => ({ 'data-field': 'createTime' }),
      render: (createTime) => (
        <span className="num-mono">{formatDateTime(createTime)}</span>
      ),
    },
    {
  title: t('applicationManagement.columns.actions'),
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={t('applicationManagement.tooltips.viewDetail')}>
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {canApprove && record.status === 'PENDING' && (
            <Tooltip title={t('applicationManagement.tooltips.approve')}>
              <Button 
                type="text" 
                icon={<CheckOutlined />} 
                size="small" 
                style={{ color: '#52c41a' }}
                onClick={() => handleApprove(record)}
              />
            </Tooltip>
          )}
          {canCancel && record.status === 'PENDING' && (
            <Tooltip title={t('applicationManagement.tooltips.cancel')}>
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                onClick={() => handleCancel(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{t('applicationManagement.title')}</span>
              <span style={{ 
                fontSize: '12px', 
                color: 'var(--text-color-secondary)', 
                fontWeight: 'normal',
                backgroundColor: 'var(--fill-color-secondary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)'
              }}>
                {t('applicationManagement.badgeRetention')}
              </span>
            </div>
          }
          extra={
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  fetchApplications();
                }}
                loading={applicationsLoading}
              >
                {t('common.refresh')}
              </Button>
            </Space>
          }
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
        >
          {/* 筛选区域 */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--component-bg)'
          }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {/* 教室搜索 */}
              <div style={{ minWidth: '200px' }}>
                <Input
                  placeholder={t('applicationManagement.filters.roomSearchPlaceholder')}
                  allowClear
                  style={{ width: '100%' }}
                  value={roomSearch.searchValue}
                  onChange={(e) => roomSearch.updateSearchValue(e.target.value)}
                  onPressEnter={() => roomSearch.searchImmediately(roomSearch.searchValue)}
                />
              </div>
              
              {/* 申请人搜索 */}
              <div style={{ minWidth: '150px' }}>
                <Input
                  placeholder={t('applicationManagement.filters.applicantSearchPlaceholder')}
                  allowClear
                  style={{ width: '100%' }}
                  value={applicantSearch.searchValue}
                  onChange={(e) => applicantSearch.updateSearchValue(e.target.value)}
                  onPressEnter={() => applicantSearch.searchImmediately(applicantSearch.searchValue)}
                />
              </div>
              
              {/* 状态筛选 */}
              <div style={{ minWidth: '120px' }}>
                <Select
                  ref={statusSelectRef}
                  placeholder={t('applicationManagement.filters.statusPlaceholder')}
                  allowClear
                  style={{ width: '100%' }}
                  value={selectedStatus}
                  onChange={(value) => {
                    setSelectedStatus(value);
                    const newParams = { status: value || undefined, pageNum: 1 };
                    setSearchParams(prev => ({ ...prev, ...newParams }));
                    fetchApplications(newParams);
                  }}
                >
                  <Option value="PENDING">{t('applicationManagement.statusOptions.PENDING')}</Option>
                  <Option value="APPROVED">{t('applicationManagement.statusOptions.APPROVED')}</Option>
                  <Option value="REJECTED">{t('applicationManagement.statusOptions.REJECTED')}</Option>
                  <Option value="CANCELLED">{t('applicationManagement.statusOptions.CANCELLED')}</Option>
                  <Option value="COMPLETED">{t('applicationManagement.statusOptions.COMPLETED')}</Option>
                  <Option value="EXPIRED">{t('applicationManagement.statusOptions.EXPIRED')}</Option>
                </Select>
              </div>
              
              {/* 使用时间筛选 */}
              <div style={{ minWidth: '150px' }}>
                <DatePicker
                  ref={datePickerRef}
                  style={{ width: '100%' }}
                  placeholder={t('applicationManagement.filters.datePlaceholder')}
                  format="YYYY-MM-DD"
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    let newParams = { pageNum: 1 };
                    if (date) {
                      // 将dayjs对象转换为YYYY-MM-DD格式的字符串
                      newParams = {
                        ...newParams,
                        queryDate: date.format('YYYY-MM-DD'),
                      };
                    } else {
                      newParams = {
                        ...newParams,
                        queryDate: undefined,
                      };
                    }
                    setSearchParams(prev => ({ ...prev, ...newParams }));
                    fetchApplications(newParams);
                  }}
                />
              </div>
              
              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  onClick={() => {
                    // 清空筛选控件内容
                    roomSearch.updateSearchValue('');
                    applicantSearch.updateSearchValue('');
                    // 清除日期选择器
                    setSelectedDate(null);
                    // 清空状态选择器
                    setSelectedStatus(undefined);
                    // 清空搜索参数并刷新数据
                    const newParams = {
                      pageNum: 1,
                      roomName: undefined,
                      username: undefined,
                      status: undefined,
                      queryDate: undefined
                    };
                    setSearchParams(newParams);
                    fetchApplications(newParams);
                  }}
                >
                  {t('applicationManagement.filters.clearFilters')}
                </Button>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {applicationsError && (
            <Alert
              message={t('applicationManagement.error.dataFetchTitle')}
              description={String(applicationsError)}
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}
          
          <div style={{ 
            flex: 1,
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            border: '0px solid var(--border-color)',
            borderRadius: '0px',
            overflow: 'hidden',
            height: '100%',
            maxHeight: '100%',
            position: 'relative'
          }}>
            {/* 表格内容区域 */}
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: '60px',
              overflow: 'hidden' // 禁止容器的垂直滚动
            }}>
              <FixedTop>
                <div style={{
                  overflowX: 'auto', // 允许水平滚动
                  overflowY: 'hidden', // 禁止垂直滚动
                  height: '100%'
                }}>
                  <Table
                    columns={columns}
                    dataSource={applications}
                    rowKey="id"
                    loading={applicationsLoading}
                    scroll={{ 
                      x: 1200, 
                      y: 'calc(100vh - 300px)',
                      scrollToFirstRowOnChange: false
                    }}
                    pagination={false}
                    onChange={handleTableChange}
                    size="middle"
                    style={{ 
                      height: '100%',
                      minWidth: '1200px' // 确保表格有最小宽度以触发水平滚动
                    }}
                    overflowX='hidden'
                    sticky={{ offsetHeader: 0 }}
                  />
                </div>
              </FixedTop>
            </div>
            
            {/* 分页组件 */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              padding: '12px 16px',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--component-bg)',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <Pagination
                {...pagination}
                showSizeChanger={true}
                showQuickJumper={true}
                showTotal={(total, range) => {
                  const tpl = t('applicationManagement.paginationTotal');
                  return tpl
                    .replace('{from}', String(range[0]))
                    .replace('{to}', String(range[1]))
                    .replace('{total}', String(total));
                }}
                pageSizeOptions={['10', '20', '50', '100']}
                size="default"
                onChange={(page, pageSize) => {
                  const newParams = {
                    pageNum: page,
                    pageSize: pageSize,
                  };
                  setSearchParams(prev => ({ ...prev, ...newParams }));
                  fetchApplications(newParams);
                }}
              />
            </div>
          </div>
        </Card>

        {/* 抽屉组件 */}
        <Drawer
          title={
            drawerType === 'detail' ? t('applicationManagement.drawer.detail') :
            drawerType === 'approve' ? t('applicationManagement.drawer.approve') :
            drawerType === 'cancel' ? t('applicationManagement.drawer.cancel') : ''
          }
          width={600}
          open={drawerVisible}
          onClose={handleCloseDrawer}
          footer={
            drawerType === 'approve' || drawerType === 'cancel' ? (
              <div style={{ textAlign: 'right' }}>
                <Button onClick={handleCloseDrawer} style={{ marginRight: 8 }}>
                  {t('common.cancel')}
                </Button>
                <Button type="primary" onClick={() => form.submit()}>
                  {t('common.confirm')}
                </Button>
              </div>
            ) : null
          }
        >
          {drawerType === 'detail' && currentApplication && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label={t('applicationManagement.descriptions.applicant')}>{currentApplication.username}</Descriptions.Item>
              <Descriptions.Item label={t('applicationManagement.descriptions.roomName')}>{currentApplication.roomName}</Descriptions.Item>
              <Descriptions.Item label={t('applicationManagement.descriptions.startTime')}><span className="num-mono" data-field="startTime">{formatDateTime(currentApplication.startTime)}</span></Descriptions.Item>
              <Descriptions.Item label={t('applicationManagement.descriptions.endTime')}><span className="num-mono" data-field="endTime">{formatDateTime(currentApplication.endTime)}</span></Descriptions.Item>
              <Descriptions.Item label={t('applicationManagement.descriptions.status')}>
                {currentApplication.status === 'EXPIRED' && currentApplication.originalStatus ? (
                  <>
                    <Tag color={getApplicationStatusColor(currentApplication.originalStatus)}>
                      {getApplicationStatusDisplayName(currentApplication.originalStatus)}
                    </Tag>
                    <Tag color="default" style={{ marginLeft: 4 }}>
                      {getApplicationStatusDisplayName(currentApplication.status)}
                    </Tag>
                  </>
                ) : (
                  <Tag color={getApplicationStatusColor(currentApplication.status)}>
                    {getApplicationStatusDisplayName(currentApplication.status)}
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t('applicationManagement.descriptions.createTime')}><span className="num-mono" data-field="createTime">{formatDateTime(currentApplication.createTime)}</span></Descriptions.Item>
              {currentApplication.reason && (
                <Descriptions.Item label={t('applicationManagement.descriptions.reason')}>{currentApplication.reason}</Descriptions.Item>
              )}
            </Descriptions>
          )}

          {(drawerType === 'approve' || drawerType === 'cancel') && currentApplication && (
            <div>
              <Descriptions column={1} bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label={t('applicationManagement.descriptions.applicant')}>{currentApplication.username}</Descriptions.Item>
                <Descriptions.Item label={t('applicationManagement.descriptions.roomName')}>{currentApplication.roomName}</Descriptions.Item>
                <Descriptions.Item label={t('applicationManagement.descriptions.time')}>
                  {(() => {
                    const r = formatTimeRange(currentApplication.startTime, currentApplication.endTime, { structured: true });
                    return r.crossDay ? (
                      <span className="num-mono" data-field="timeRange">
                        <div>{r.startFormatted} -</div>
                        <div>{r.endFormatted}</div>
                      </span>
                    ) : (
                      <span className="num-mono" data-field="timeRange">{r.text}</span>
                    );
                  })()}
                </Descriptions.Item>
              </Descriptions>
              
              <Divider />
              
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                {drawerType === 'approve' && (
                  <Form.Item
                    name="approved"
                    label={t('applicationManagement.form.approveResult')}
                    rules={[{ required: true, message: t('applicationManagement.form.pleaseSelectApproveResult') }]}
                  >
                    <Select placeholder={t('applicationManagement.form.pleaseSelectApproveResult')}>
                      <Option value={true}>{t('applicationManagement.form.approveOptionApprove')}</Option>
                      <Option value={false}>{t('applicationManagement.form.approveOptionReject')}</Option>
                    </Select>
                  </Form.Item>
                )}

                <Form.Item
                  name="reason"
                  label={drawerType === 'approve' ? t('applicationManagement.form.approveOpinion') : t('applicationManagement.form.cancelReason')}
                  rules={[{ required: true, message: drawerType === 'approve' ? t('applicationManagement.form.enterApproveOpinion') : t('applicationManagement.form.enterCancelReason') }]}
                >
                  <Input.TextArea 
                    rows={4} 
                    placeholder={drawerType === 'approve' ? t('applicationManagement.form.enterApproveOpinion') : t('applicationManagement.form.enterCancelReason')} 
                  />
                </Form.Item>
              </Form>
            </div>
          )}
        </Drawer>
      </div>
    </PageErrorBoundary>
  );
} 