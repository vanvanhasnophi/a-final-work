import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Card, Button, Tag, Space, Input, Select, message, Alert, Drawer, Form, InputNumber, DatePicker, TimePicker, Pagination, Modal } from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../api/room';
import { applicationAPI } from '../api/application';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { useDebounce } from '../hooks/useDebounce';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { formatDateTime, formatTimeRange } from '../utils/dateFormat';
import { getRoomTypeDisplayName, getRoomTypeEnumValue, roomTypeOptions } from '../utils/roomMapping';
import { formatDateTimeForBackend, validateTimeRange } from '../utils/dateUtils';
import { useTimeConflictCheck } from '../hooks/useTimeConflictCheck';
import { useAuth } from '../contexts/AuthContext';
import { canCreateRoom, canDeleteRoom } from '../utils/permissionUtils';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function RoomList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState({
    pageNum: 1,
    pageSize: 10,
  });
  const [messageApi, contextHolder] = message.useMessage();
  
  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'add', 'detail', 'apply'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [futureApplications, setFutureApplications] = useState([]);
  const [form] = Form.useForm();
  
  // 筛选控件状态管理
  const [selectedType, setSelectedType] = useState(undefined);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const typeSelectRef = useRef(null);
  const statusSelectRef = useRef(null);
  
  // 时间冲突检查Hook
  const { isChecking, hasConflict, conflictMessage, checkTimeConflict, clearConflict } = useTimeConflictCheck(
    currentRoom?.id
  );
  
  const { loading, error, executeWithRetry } = useApiWithRetry();
  const { debounce, clearDebounce } = useDebounce(500);
  
  // 获取房间列表
  const fetchRooms = useCallback(async (params = {}) => {
    const result = await executeWithRetry(
      async () => {
        // 获取当前的searchParams，避免闭包问题
        const currentSearchParams = searchParams;
        const requestParams = {
          ...currentSearchParams,
          ...params,
        };
        
        console.log('发送分页请求参数:', requestParams);
        const response = await roomAPI.getRoomList(requestParams);
        
        const { records, total, pageNum, pageSize } = response.data;
        console.log('分页响应数据:', response.data);
        
        setRooms(records || []);
        setPagination({
          current: pageNum || 1,
          pageSize: pageSize || 10,
          total: total || 0,
        });
        
        return response.data;
      },
      {
        errorMessage: '获取房间列表失败，请检查网络连接',
        maxRetries: 0, // 不重试，避免反复请求
        retryDelay: 0
      }
    );
    
    return result;
  }, [executeWithRetry]); // 移除searchParams依赖

  // 页面刷新Hook
  const handlePageRefresh = usePageRefresh(fetchRooms);
  
  // 手动重试函数
  const handleManualRetry = useCallback(() => {
    fetchRooms();
  }, [fetchRooms]);

  // 删除房间
  const handleDeleteRoom = (record) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除房间 "${record.name}" 吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await roomAPI.deleteRoom(record.id);
          messageApi.success('房间删除成功');
          fetchRooms(); // 刷新列表
        } catch (error) {
          console.error('删除房间失败:', error);
          messageApi.error('删除房间失败: ' + (error.response?.data?.message || error.message || '未知错误'));
        }
      }
    });
  };

  // 初始化加载
  useEffect(() => {
    fetchRooms();
  }, []); // 只在组件挂载时执行一次



  // 清理定时器
  useEffect(() => {
    return () => {
      clearDebounce();
    };
  }, [clearDebounce]);

  const handleTableChange = (pagination, filters, sorter) => {
    console.log('表格分页变化:', pagination);
    const newParams = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchRooms(newParams);
  };

  const handleSearch = (value) => {
    const newParams = {
      ...searchParams,
      pageNum: 1,
      name: value || undefined, // 如果value为空字符串，则设为undefined
    };
    setSearchParams(newParams);
    debounce(() => fetchRooms(newParams));
  };

  const handleTypeFilter = (value) => {
    const newParams = {
      ...searchParams,
      pageNum: 1,
      type: value === 'all' ? undefined : getRoomTypeEnumValue(value),
    };
    setSearchParams(newParams);
    debounce(() => fetchRooms(newParams));
  };

  const handleStatusFilter = (value) => {
    // 将前端值映射到后端枚举值
    const statusMapping = {
      'available': 'AVAILABLE',
      'occupied': 'USING',
      'reserved': 'RESERVED',
      'maintenance': 'MAINTENANCE',
      'cleaning': 'CLEANING'
    };
    
    const newParams = {
      ...searchParams,
      pageNum: 1,
      status: value === 'all' ? undefined : statusMapping[value],
    };
    setSearchParams(newParams);
    debounce(() => fetchRooms(newParams));
  };

  // 打开新增房间抽屉
  const handleAddRoom = () => {
    setDrawerType('add');
    setCurrentRoom(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  // 打开查看详情抽屉
  const handleViewDetail = async (record) => {
    setDrawerType('detail');
    setCurrentRoom(record);
    setDrawerVisible(true);
    
    // 获取房间未来的已批准预约
    try {
      const response = await applicationAPI.getFutureApprovedApplications(record.id);
      console.log('详情抽屉未来预约数据:', response.data);
      setFutureApplications(response.data || []);
    } catch (error) {
      console.error('获取未来预约失败:', error);
      setFutureApplications([]);
    }
  };

  // 打开申请房间抽屉
  const handleApply = async (record) => {
    setDrawerType('apply');
    setCurrentRoom(record);
    form.resetFields();
    // 预填充房间信息
    form.setFieldsValue({
      room: record.id,
      roomName: record.name,
      roomLocation: record.location
    });
    setDrawerVisible(true);
    
    // 获取房间未来的已批准预约
    try {
      const response = await applicationAPI.getFutureApprovedApplications(record.id);
      console.log('未来预约数据:', response.data);
      setFutureApplications(response.data || []);
    } catch (error) {
      console.error('获取未来预约失败:', error);
      setFutureApplications([]);
    }
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setDrawerType('');
    setCurrentRoom(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (drawerType === 'add') {
        await executeWithRetry(
          async () => {
            const roomData = {
              ...values,
              type: getRoomTypeEnumValue(values.type)
            };
            const response = await roomAPI.createRoom(roomData);
            messageApi.success('房间创建成功');
            handleCloseDrawer();
            fetchRooms(); // 刷新列表
            return response;
          },
          {
            errorMessage: '创建房间失败',
            successMessage: '房间创建成功'
          }
        );
      } else if (drawerType === 'apply') {
        // 验证时间范围
        const [startTime, endTime] = values.timeRange;
        
        const validation = validateTimeRange(startTime, endTime);
        if (!validation.valid) {
          messageApi.error(validation.message);
          return;
        }
        
        // 检查时间冲突
        if (hasConflict) {
          messageApi.error('所选时间段与已有预约冲突，请选择其他时间');
          return;
        }
        
        await executeWithRetry(
          async () => {
            const applicationData = {
              userId: user.id, // 添加用户ID
              roomId: currentRoom.id,
              startTime: formatDateTimeForBackend(startTime),
              endTime: formatDateTimeForBackend(endTime),
              reason: values.reason,
              crowd: values.crowd,
              contact: values.contact,
            };
            
            console.log('提交申请数据:', applicationData);
            const response = await applicationAPI.createApplication(applicationData);
            messageApi.success('申请提交成功，正在跳转到申请列表...');
            handleCloseDrawer();
            // 跳转到申请列表页面
            navigate('/applications');
            return response;
          },
          {
            errorMessage: '申请提交失败',
            successMessage: '申请提交成功'
          }
        );
      }
    } catch (error) {
      console.error('提交失败:', error);
      messageApi.error('操作失败，请重试');
    }
  };

  const columns = [
    {
      title: '教室名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => getRoomTypeDisplayName(type),
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => `${capacity}人`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMapping = {
          'AVAILABLE': '空闲',
          'USING': '使用中',
          'RESERVED': '已预约',
          'MAINTENANCE': '维护中',
          'CLEANING': '清洁中',
          'UNAVAILABLE': '不可用'
        };
        
        let color = 'success';
        if (status === 'USING') color = 'warning';
        if (status === 'MAINTENANCE' || status === 'CLEANING') color = 'error';
        if (status === 'RESERVED') color = 'processing';
        if (status === 'AVAILABLE') color = 'success';
        if (status === 'UNAVAILABLE') color = 'default';
        
        return <Tag color={color}>{statusMapping[status] || status}</Tag>;
      },
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" onClick={() => handleApply(record)}>申请</Button>
          {canDeleteRoom(user?.role) && (
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteRoom(record)}
            >
              删除
            </Button>
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
        title="教室列表"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                // 清空筛选控件内容
                setSelectedType(undefined);
                setSelectedStatus(undefined);
                // 清空搜索参数并刷新数据
                const newParams = {
                  pageNum: 1,
                  name: undefined,
                  type: undefined,
                  status: undefined
                };
                setSearchParams(newParams);
                fetchRooms(newParams);
              }}
              loading={loading}
            >
              刷新
            </Button>
            {canCreateRoom(user?.role) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRoom}>
                添加房间
              </Button>
            )}
          </Space>
        }
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* 错误提示 */}
        {error && (
          <Alert
            message="数据获取失败"
            description={error}
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
            {/* 房间搜索 */}
            <div style={{ minWidth: '200px' }}>
              <Input
                placeholder="搜索房间名称"
                allowClear
                style={{ width: '100%' }}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            {/* 房间类型筛选 */}
            <div style={{ minWidth: '120px' }}>
              <Select
                ref={typeSelectRef}
                placeholder="全部类型"
                allowClear
                style={{ width: '100%' }}
                value={selectedType}
                onChange={(value) => {
                  setSelectedType(value);
                  handleTypeFilter(value);
                }}
              >
                <Option value="all">全部类型</Option>
                <Option value="caseroom">案例教室</Option>
                <Option value="seminar">研讨间</Option>
                <Option value="lab">实验室</Option>
                <Option value="lecture">平面教室</Option>
              </Select>
            </div>
            
            {/* 房间状态筛选 */}
            <div style={{ minWidth: '120px' }}>
              <Select
                ref={statusSelectRef}
                placeholder="全部状态"
                allowClear
                style={{ width: '100%' }}
                value={selectedStatus}
                onChange={(value) => {
                  setSelectedStatus(value);
                  handleStatusFilter(value);
                }}
              >
                <Option value="all">全部状态</Option>
                <Option value="available">空闲</Option>
                <Option value="occupied">使用中</Option>
                <Option value="reserved">已预约</Option>
                <Option value="maintenance">维护中</Option>
                <Option value="cleaning">清洁中</Option>
              </Select>
            </div>
            
            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                onClick={() => {
                  // 清空筛选控件内容
                  setSelectedType(undefined);
                  setSelectedStatus(undefined);
                  // 清空搜索参数并刷新数据
                  const newParams = {
                    pageNum: 1,
                    name: undefined,
                    type: undefined,
                    status: undefined
                  };
                  setSearchParams(newParams);
                  fetchRooms(newParams);
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
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
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
            overflow: 'auto'
          }}>
            <Table
              columns={columns}
              dataSource={rooms}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200, y: '100%' }}
              pagination={false}
              onChange={handleTableChange}
              size="middle"
              style={{ height: '100%' }}
            />
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
                fetchRooms(newParams);
              }}
            />
          </div>
        </div>
      </Card>

      {/* 抽屉组件 */}
      <Drawer
        title={
          drawerType === 'add' ? '新增房间' :
          drawerType === 'detail' ? '房间详情' :
          drawerType === 'apply' ? '申请房间' : ''
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
                {drawerType === 'add' ? '创建' : '提交申请'}
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
              name="name"
              label="房间名称"
              rules={[{ required: true, message: '请输入房间名称' }]}
            >
              <Input placeholder="请输入房间名称" />
            </Form.Item>
            
            <Form.Item
              name="type"
              label="房间类型"
              rules={[{ required: true, message: '请选择房间类型' }]}
            >
              <Select placeholder="请选择房间类型">
                {roomTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="capacity"
              label="容量"
              rules={[{ required: true, message: '请输入容量' }]}
            >
              <InputNumber
                min={1}
                max={1000}
                placeholder="请输入容量"
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item
              name="location"
              label="位置"
              rules={[{ required: true, message: '请输入位置' }]}
            >
              <Input placeholder="请输入位置" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={4} placeholder="请输入房间描述" />
            </Form.Item>
          </Form>
        )}

        {drawerType === 'detail' && currentRoom && (
          <div>
            <div style={{ 
              marginBottom: 16, 
              padding: 16, 
              backgroundColor: 'var(--component-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: 6 
            }}>
              <div style={{ color: 'var(--text-color)' }}>
                <div style={{ marginBottom: 12 }}>
                  <strong>房间名称：</strong>
                  <span>{currentRoom.name}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>房间类型：</strong>
                  <span>{getRoomTypeDisplayName(currentRoom.type)}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>容量：</strong>
                  <span>{currentRoom.capacity}人</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>状态：</strong>
                  <Tag color={
                    currentRoom.status === 'AVAILABLE' ? 'success' :
                    currentRoom.status === 'USING' ? 'warning' :
                    currentRoom.status === 'RESERVED' ? 'processing' :
                    currentRoom.status === 'MAINTENANCE' || currentRoom.status === 'CLEANING' ? 'error' : 'default'
                  }>
                    {currentRoom.status === 'AVAILABLE' ? '空闲' :
                     currentRoom.status === 'USING' ? '使用中' :
                     currentRoom.status === 'RESERVED' ? '已预约' :
                     currentRoom.status === 'MAINTENANCE' ? '维护中' :
                     currentRoom.status === 'CLEANING' ? '清洁中' :
                     currentRoom.status === 'UNAVAILABLE' ? '不可用' : currentRoom.status}
                  </Tag>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>位置：</strong>
                  <span>{currentRoom.location}</span>
                </div>
                {currentRoom.description && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>描述：</strong>
                    <p style={{ marginTop: 4, marginBottom: 0 }}>{currentRoom.description}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* 未来预约信息 */}
            <div style={{ 
              marginBottom: 16, 
              padding: 16, 
              backgroundColor: 'var(--component-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: 6 
            }}>
              <h4 style={{ color: 'var(--text-color)', marginBottom: 12 }}>
                未来已批准预约 ({futureApplications.length}个)
              </h4>
              {futureApplications.length > 0 ? (
                <div style={{ color: 'var(--text-color)' }}>
                  {futureApplications.map((app, index) => (
                    <div key={app.id} style={{ marginBottom: 8, fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-color-secondary)' }}>
                        {formatTimeRange(app.startTime, app.endTime)}
                      </span>
                      <span style={{ marginLeft: 8, color: 'var(--text-color-secondary)' }}>
                        - {app.reason}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  color: 'var(--text-color-secondary)', 
                  textAlign: 'center', 
                  padding: '20px',
                  fontSize: '14px'
                }}>
                  暂无未来预约
                </div>
              )}
            </div>
          </div>
        )}

        {drawerType === 'apply' && currentRoom && (
          <div>
            <div style={{ 
              marginBottom: 16, 
              padding: 16, 
              backgroundColor: 'var(--component-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: 6 
            }}>
              <p style={{ color: 'var(--text-color)' }}><strong>房间名称：</strong>{currentRoom.name}</p>
              <p style={{ color: 'var(--text-color)' }}><strong>房间类型：</strong>{getRoomTypeDisplayName(currentRoom.type)}</p>
              <p style={{ color: 'var(--text-color)' }}><strong>容量：</strong>{currentRoom.capacity}人</p>
              <p style={{ color: 'var(--text-color)' }}><strong>位置：</strong>{currentRoom.location}</p>
            </div>
            
            {/* 未来预约信息 */}
            <div style={{ 
              marginBottom: 16, 
              padding: 16, 
              backgroundColor: 'var(--component-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: 6 
            }}>
              <h4 style={{ color: 'var(--text-color)', marginBottom: 12 }}>
                未来已批准预约 ({futureApplications.length}个)
              </h4>
              {futureApplications.length > 0 ? (
                <div style={{ color: 'var(--text-color)' }}>
                  {futureApplications.map((app, index) => (
                    <div key={app.id} style={{ marginBottom: 8, fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-color-secondary)' }}>
                        {formatTimeRange(app.startTime, app.endTime)}
                      </span>
                      <span style={{ marginLeft: 8, color: 'var(--text-color-secondary)' }}>
                        - {app.reason}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  color: 'var(--text-color-secondary)', 
                  textAlign: 'center', 
                  padding: '20px',
                  fontSize: '14px'
                }}>
                  暂无未来预约
                </div>
              )}
            </div>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="timeRange"
                label="使用时间"
                rules={[{ required: true, message: '请选择使用时间' }]}
                validateStatus={hasConflict ? 'error' : ''}
                help={hasConflict ? conflictMessage : ''}
              >
                <RangePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  disabledDate={(current) => {
                    return current && current < dayjs().startOf('day');
                  }}
                  minuteStep={15}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      checkTimeConflict(dates[0], dates[1]);
                    } else {
                      clearConflict();
                    }
                  }}
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
                  max={currentRoom.capacity}
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
          </div>
        )}
      </Drawer>
    </div>
    </PageErrorBoundary>
  );
} 