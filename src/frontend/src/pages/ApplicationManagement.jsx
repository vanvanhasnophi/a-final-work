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
import { useDebounceSearchV2 } from '../hooks/useDebounceSearchV2';
import { getUserDisplayName } from '../utils/userDisplay';

const { Option } = Select;

export default function ApplicationManagement() {
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
        errorMessage: '获取申请列表失败，请检查网络连接',
        maxRetries: 0,
        retryDelay: 0,
        onError: (error) => {
          if (error.response?.status === 401) {
            setAuthError('Token已过期，请重新登录');
            messageApi.error('Token已过期，请重新登录');
          } else if (error.response?.status === 403) {
            setAuthError('权限不足，需要管理员或审批人权限');
            messageApi.error('权限不足，需要管理员或审批人权限');
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
            messageApi.success(values.approved ? '申请已批准' : '申请已驳回');
            handleCloseDrawer();
            fetchApplications();
            return response;
          },
          {
            errorMessage: '审批操作失败',
            successMessage: '审批操作成功'
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
            messageApi.success('申请已撤销');
            handleCloseDrawer();
            fetchApplications();
            return response;
          },
          {
            errorMessage: '撤销操作失败',
            successMessage: '撤销操作成功'
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
          subTitle="抱歉，您没有权限访问此页面。"
          extra={
            <div>
              <p>当前用户角色: {getRoleDisplayName(user?.role)}</p>
              <p>需要管理员或审批人权限才能访问申请管理功能。</p>
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
          title="访问失败"
          subTitle={authError}
          extra={[
            <Button key="back" onClick={() => window.history.back()}>
              返回上一页
            </Button>,
            <Button key="login" type="primary" onClick={() => window.location.href = '/login'}>
              重新登录
            </Button>
          ]}
        />
      </div>
    );
  }

  const columns = [
    {
      title: '教室名称',
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
      title: '申请人',
      dataIndex: 'userNickname',
      key: 'userNickname',
      render: (userNickname, record) => {
        // 优先显示nickname，如果不存在则显示username
        return getUserDisplayName({ nickname: userNickname, username: record.username });
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const displayName = getApplicationStatusDisplayName(status);
        const color = getApplicationStatusColor(status);
        return <Tag color={color}>{displayName}</Tag>;
      },
    },
    {
      title: '使用时间',
      key: 'time',
      render: (_, record) => (
        <div>
          {formatTimeRange(record.startTime, record.endTime)}
        </div>
      ),
    },
    {
      title: '使用原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (createTime) => formatDateTime(createTime),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {canApprove && record.status === 'PENDING' && (
            <Tooltip title="审批申请">
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
            <Tooltip title="撤销申请">
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
              <span>申请管理</span>
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
                刷新
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
                  placeholder="搜索教室名称"
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
                  placeholder="搜索申请人"
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
                  placeholder="全部状态"
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
                  <Option value="PENDING">待审批</Option>
                  <Option value="APPROVED">已批准</Option>
                  <Option value="REJECTED">已驳回</Option>
                  <Option value="CANCELLED">已取消</Option>
                  <Option value="COMPLETED">已完成</Option>
                  <Option value="EXPIRED">已过期</Option>
                </Select>
              </div>
              
              {/* 使用时间筛选 */}
              <div style={{ minWidth: '150px' }}>
                <DatePicker
                  ref={datePickerRef}
                  style={{ width: '100%' }}
                  placeholder="选择日期"
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
                  清空筛选
                </Button>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {applicationsError && (
            <Alert
              message="数据获取失败"
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
                showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`}
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
            drawerType === 'detail' ? '申请详情' :
            drawerType === 'approve' ? '审批申请' :
            drawerType === 'cancel' ? '撤销申请' : ''
          }
          width={600}
          open={drawerVisible}
          onClose={handleCloseDrawer}
          footer={
            drawerType === 'approve' || drawerType === 'cancel' ? (
              <div style={{ textAlign: 'right' }}>
                <Button onClick={handleCloseDrawer} style={{ marginRight: 8 }}>
                  取消
                </Button>
                <Button type="primary" onClick={() => form.submit()}>
                  确定
                </Button>
              </div>
            ) : null
          }
        >
          {drawerType === 'detail' && currentApplication && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="申请人">{currentApplication.username}</Descriptions.Item>
              <Descriptions.Item label="教室名称">{currentApplication.roomName}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{formatDateTime(currentApplication.startTime)}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{formatDateTime(currentApplication.endTime)}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getApplicationStatusColor(currentApplication.status)}>
                  {getApplicationStatusDisplayName(currentApplication.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">{formatDateTime(currentApplication.createTime)}</Descriptions.Item>
              {currentApplication.reason && (
                <Descriptions.Item label="备注">{currentApplication.reason}</Descriptions.Item>
              )}
            </Descriptions>
          )}

          {(drawerType === 'approve' || drawerType === 'cancel') && currentApplication && (
            <div>
              <Descriptions column={1} bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="申请人">{currentApplication.username}</Descriptions.Item>
                <Descriptions.Item label="教室名称">{currentApplication.roomName}</Descriptions.Item>
                <Descriptions.Item label="时间">
                  {formatDateTime(currentApplication.startTime)} - {formatDateTime(currentApplication.endTime)}
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
                    label="审批结果"
                    rules={[{ required: true, message: '请选择审批结果' }]}
                  >
                    <Select placeholder="请选择审批结果">
                      <Option value={true}>批准</Option>
                      <Option value={false}>拒绝</Option>
                    </Select>
                  </Form.Item>
                )}

                <Form.Item
                  name="reason"
                  label={drawerType === 'approve' ? '审批意见' : '撤销原因'}
                  rules={[{ required: true, message: '请输入' + (drawerType === 'approve' ? '审批意见' : '撤销原因') }]}
                >
                  <Input.TextArea 
                    rows={4} 
                    placeholder={drawerType === 'approve' ? '请输入审批意见' : '请输入撤销原因'} 
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