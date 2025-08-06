import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Card, Button, Space, Drawer, Form, Input, DatePicker, Select, message, Alert, InputNumber, TimePicker, Tag, Pagination, Switch, Tooltip } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { applicationAPI } from '../api/application';
import { roomAPI } from '../api/room';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { getRoleDisplayName } from '../utils/roleMapping';
import { getApplicationStatusDisplayName, getApplicationStatusColor } from '../utils/statusMapping';
import { getRoomTypeDisplayName } from '../utils/roomMapping';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, formatTimeRange, formatRelativeTime } from '../utils/dateFormat';
import { formatDateTimeForBackend, validateTimeRange } from '../utils/dateUtils';
import { useDebounceSearchV2 } from '../hooks/useDebounceSearchV2';
import { useAuth } from '../contexts/AuthContext';
import FixedTop from '../components/FixedTop';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ApplicationList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showOnlyMyApplications, setShowOnlyMyApplications] = useState(false);
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
  const datePickerRef = useRef(null);
  const statusSelectRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(undefined);


  
  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'add', 'detail', 'approve'
  const [currentApplication, setCurrentApplication] = useState(null);
  
  const { loading: applicationsLoading, error: applicationsError, executeWithRetry: executeApplications } = useApiWithRetry();
  const { loading: roomsLoading, error: roomsError, executeWithRetry: executeRooms } = useApiWithRetry();
  
  // 页面刷新Hook
  const handlePageRefresh = usePageRefresh(() => {
    fetchApplications();
    fetchRooms();
  });
  
  // 防抖搜索Hook
  const roomSearch = useDebounceSearchV2((value) => {
    const newParams = { roomName: value || undefined, pageNum: 1 };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchApplications(newParams);
  }, 500);
  
  const applicantSearch = useDebounceSearchV2((value) => {
    const newParams = { nickname: value || undefined, pageNum: 1 };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchApplications(newParams);
  }, 500);

  // 获取申请列表
  const fetchApplications = useCallback(async (params = {}) => {
    const result = await executeApplications(
      async () => {
        // 获取当前的searchParams，避免闭包问题
        const currentSearchParams = searchParams;
        const requestParams = {
          ...currentSearchParams,
          ...params,
        };
        
        // 如果勾选了"仅查看自己的申请"，添加用户ID筛选
        if (showOnlyMyApplications && user?.id) {
          requestParams.userId = user.id;
          // 清空申请人搜索，因为只查看自己的申请
          requestParams.nickname = undefined;
        } else {
          // 如果没有勾选"仅查看自己的申请"，移除用户ID筛选
          requestParams.userId = undefined;
          requestParams.nickname = undefined;
        }
        
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
        
        return response.data;
      },
      {
        errorMessage: '获取申请列表失败，请检查网络连接',
        maxRetries: 0, // 不重试，避免反复请求
        retryDelay: 0
      }
    );
    return result;
  }, [executeApplications, searchParams, user?.id]); // 移除showOnlyMyApplications依赖

  // 获取教室列表（用于下拉选择）
  const fetchRooms = useCallback(async () => {
    const result = await executeRooms(
      async () => {
        const response = await roomAPI.getRoomList({ pageSize: 100 });
        setRooms(response.data.records || []);
        return response.data.records;
      },
      {
        errorMessage: '获取教室列表失败',
        maxRetries: 0, // 不重试，避免反复请求
        retryDelay: 0,
        showRetryMessage: false
      }
    );
    return result;
  }, [executeRooms]);

  // 初始化加载
  useEffect(() => {
    fetchApplications();
    fetchRooms();
  }, [fetchApplications, fetchRooms]); // 修复依赖

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

  // 跳转到教室列表页面进行申请
  const handleAddApplication = () => {
    navigate('/rooms');
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
      if (drawerType === 'add') {
        // 处理时间范围
        const [startTime, endTime] = values.timeRange;
        
        const validation = validateTimeRange(startTime, endTime);
        if (!validation.valid) {
          messageApi.error(validation.message);
          return;
        }
        
        const applicationData = {
          roomId: values.room,
          startTime: formatDateTimeForBackend(startTime),
          endTime: formatDateTimeForBackend(endTime),
          reason: values.reason,
          crowd: values.crowd,
          contact: values.contact,
        };
        
        await executeApplications(
          async () => {
            const response = await applicationAPI.createApplication(applicationData);
            messageApi.success('申请提交成功');
            handleCloseDrawer();
            fetchApplications(); // 刷新列表
            return response;
          },
          {
            errorMessage: '申请提交失败',
            successMessage: '申请提交成功'
          }
        );
      } else if (drawerType === 'approve') {
        await executeApplications(
          async () => {
            const response = await applicationAPI.approveApplication({
              applicationId: currentApplication.id,
              approved: values.approved,
              reason: values.reason
            });
            messageApi.success(values.approved ? '申请已批准' : '申请已驳回');
            handleCloseDrawer();
            fetchApplications(); // 刷新列表
            return response;
          },
          {
            errorMessage: '操作失败',
            successMessage: '操作成功'
          }
        );
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

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
          {record.status === 'PENDING' && (
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
                  nickname: undefined,
                  status: undefined,
                  queryDate: undefined
                };
                setSearchParams(newParams);
                fetchApplications(newParams);
              }}
              loading={applicationsLoading}
            >
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddApplication}>
              新建申请
            </Button>
          </Space>
        }
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* 错误提示 */}
        {(applicationsError || roomsError) && (
          <Alert
            message="数据获取失败"
            description={String(applicationsError || roomsError)}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        
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
                style={{ 
                  width: '100%',
                  ...(showOnlyMyApplications && {
                    backgroundColor: 'var(--disabled-bg)',
                    color: 'var(--text-color-disabled)',
                    cursor: 'not-allowed',
                    opacity: 0.6
                  })
                }}
                value={applicantSearch.searchValue}
                onChange={(e) => applicantSearch.updateSearchValue(e.target.value)}
                onPressEnter={() => applicantSearch.searchImmediately(applicantSearch.searchValue)}
                disabled={showOnlyMyApplications}
              />
            </div>
            
                        {/* 仅查看自己的申请 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '150px',
              gap: '8px',
              height: '32px'
            }}>
              <Switch
                checked={showOnlyMyApplications}
                onChange={(checked) => {
                  // 如果勾选了"仅查看自己的申请"，清空申请人搜索
                  if (checked) {
                    // 直接设置搜索值，避免触发防抖搜索
                    applicantSearch.updateSearchValue('');
                  }
                  
                  // 构建新的搜索参数
                  const newParams = {
                    pageNum: 1,
                    roomName: roomSearch.searchValue || undefined,
                    nickname: checked ? undefined : (applicantSearch.searchValue || undefined),
                    status: selectedStatus,
                    queryDate: selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined,
                    userId: checked ? user?.id : undefined
                  };
                  
                  // 先更新搜索参数
                  setSearchParams(newParams);
                  
                  // 更新状态
                  setShowOnlyMyApplications(checked);
                  
                  
                }}
                size="small"
              />
              <span style={{ 
                fontSize: '14px', 
                color: 'var(--text-color)',
                lineHeight: '32px'
              }}>
                仅查看自己的申请
              </span>
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
                // 清空"仅查看自己的申请"复选框
                setShowOnlyMyApplications(false);
                // 清空搜索参数并刷新数据
                const newParams = {
                  pageNum: 1,
                  roomName: undefined,
                  nickname: undefined,
                  status: undefined,
                  queryDate: undefined,
                  userId: undefined
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

          
          {/* 表格内容区域 - 可滚动 */}
          <div style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: '60px', // 为分页组件留出空间
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
          
          {/* 分页组件 - 常驻 */}
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
          drawerType === 'add' ? '新建申请' :
          drawerType === 'detail' ? '申请详情' :
          drawerType === 'approve' ? '审批申请' : ''
        }
        width={600}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        footer={
          drawerType !== 'detail' ? (
            <div style={{ textAlign: 'right' }}>
              <Button onClick={handleCloseDrawer} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" onClick={() => form.submit()}>
                {drawerType === 'add' ? '提交申请' : '确认审批'}
              </Button>
            </div>
          ) : null
        }
      >
        {drawerType === 'add' && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="room"
              label="选择教室"
              rules={[{ required: true, message: '请选择教室' }]}
            >
              <Select placeholder="请选择教室">
                {rooms.map(room => (
                  <Option key={room.id} value={room.id}>
                    {room.name} ({room.location}) - {getRoomTypeDisplayName(room.type)}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="timeRange"
              label="使用时间"
              rules={[{ required: true, message: '请选择使用时间' }]}
            >
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  return current && current < dayjs().startOf('day');
                }}
                disabledTime={(date, type) => {
                  if (type === 'start') {
                    return {
                      disabledHours: () => [],
                      disabledMinutes: () => [],
                      disabledSeconds: () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
                    };
                  }
                  return {
                    disabledHours: () => [],
                    disabledMinutes: () => [],
                    disabledSeconds: () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
                  };
                }}
                minuteStep={15}
              />
            </Form.Item>

            <Form.Item
              name="reason"
              label="使用原因"
              rules={[{ required: true, message: '请输入使用原因' }]}
            >
              <Input.TextArea rows={3} placeholder="请详细描述使用原因" />
            </Form.Item>

            <Form.Item
              name="crowd"
              label="参与人数"
              rules={[{ required: true, message: '请输入参与人数' }]}
            >
              <InputNumber
                min={1}
                max={1000}
                placeholder="请输入参与人数"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="contact"
              label="联系方式"
              rules={[{ required: true, message: '请输入联系方式' }]}
            >
              <Input placeholder="请输入联系方式" />
            </Form.Item>

            <Form.Item
              name="remark"
              label="备注"
            >
              <Input.TextArea rows={3} placeholder="请输入备注信息" />
            </Form.Item>
          </Form>
        )}

        {drawerType === 'detail' && currentApplication && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>申请教室：</strong>
              <span>{currentApplication.roomName}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>申请人：</strong>
              <span>{currentApplication.userNickname || currentApplication.username}</span>
              {currentApplication.userRole && (
                <Tag color="processing" style={{ marginLeft: '8px' }}>
                  {getRoleDisplayName(currentApplication.userRole)}
                </Tag>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>使用时间：</strong>
              <div>
                {formatTimeRange(currentApplication.startTime, currentApplication.endTime)}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>使用原因：</strong>
              <p>{currentApplication.reason}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>状态：</strong>
              <Tag color={getApplicationStatusColor(currentApplication.status)}>
                {getApplicationStatusDisplayName(currentApplication.status)}
              </Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>申请时间：</strong>
              <span>{formatDateTime(currentApplication.createTime)}</span>
            </div>
            {currentApplication.crowd && (
              <div style={{ marginBottom: 16 }}>
                <strong>参与人数：</strong>
                <span>{currentApplication.crowd}人</span>
              </div>
            )}
            {currentApplication.contact && (
              <div style={{ marginBottom: 16 }}>
                <strong>联系方式：</strong>
                <span>{currentApplication.contact}</span>
              </div>
            )}
            {currentApplication.remark && (
              <div style={{ marginBottom: 16 }}>
                <strong>备注：</strong>
                <p>{currentApplication.remark}</p>
              </div>
            )}
          </div>
        )}

        {drawerType === 'approve' && currentApplication && (
          <div>
            <div style={{ 
              marginBottom: 16, 
              padding: 16, 
              backgroundColor: 'var(--component-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: 6 
            }}>
              <h4 style={{ color: 'var(--text-color)', marginBottom: 12 }}>申请信息</h4>
              <div style={{ color: 'var(--text-color)' }}>
                <p><strong>申请教室：</strong>{currentApplication.roomName}</p>
                <p><strong>申请人：</strong>{currentApplication.userNickname || currentApplication.username}
                  {currentApplication.userRole && (
                    <Tag color="processing" style={{ marginLeft: '8px' }}>
                      {getRoleDisplayName(currentApplication.userRole)}
                    </Tag>
                  )}
                </p>
                <p><strong>使用时间：</strong>{formatTimeRange(currentApplication.startTime, currentApplication.endTime)}</p>
                <p><strong>使用原因：</strong>{currentApplication.reason}</p>
                {currentApplication.crowd && (
                  <p><strong>参与人数：</strong>{currentApplication.crowd}人</p>
                )}
                {currentApplication.contact && (
                  <p><strong>联系方式：</strong>{currentApplication.contact}</p>
                )}
              </div>
            </div>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
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
              
              <Form.Item
                name="reason"
                label="审批意见"
                rules={[{ required: true, message: '请输入审批意见' }]}
              >
                <Input.TextArea rows={4} placeholder="请输入审批意见" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
    </PageErrorBoundary>
  );
} 