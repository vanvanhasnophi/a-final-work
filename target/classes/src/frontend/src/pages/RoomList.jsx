import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Card, Button, Tag, Space, Input, Select, message, Alert, Drawer, Form, InputNumber, DatePicker, Pagination, Modal, Tooltip } from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../api/room';
import { applicationAPI } from '../api/application';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { useDebounce } from '../hooks/useDebounce';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { formatTimeRange } from '../utils/dateFormat';
import { getRoomTypeDisplayName, getRoomTypeEnumValue, getRoomTypeFrontendValue, roomTypeOptions } from '../utils/roomMapping';
import { getRoomStatusDisplayName, getRoomStatusColor, roomStatusOptions } from '../utils/roomStatusMapping';
import { formatDateTimeForBackend, validateTimeRange } from '../utils/dateUtils';
import { useTimeConflictCheck } from '../hooks/useTimeConflictCheck';
import { useAuth } from '../contexts/AuthContext';
import { canCreateRoom, canDeleteRoom, canUpdateRoom, canCreateApplication } from '../utils/permissionUtils';
import FixedTop from '../components/FixedTop';
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
  
  // 确认弹窗状态
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [editFormValues, setEditFormValues] = useState({});
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteRoomRecord, setDeleteRoomRecord] = useState(null);
  

  
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
  
  // 获取教室列表
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
        errorMessage: '获取教室列表失败，请检查网络连接',
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

  // 删除教室
  const handleDeleteRoom = (record) => {
    console.log('handleDeleteRoom called with record:', record);
    
    // 检查教室状态
    if (record.status === 'USING' || record.status === 'RESERVED') {
      messageApi.warning('教室正在使用中或已预约，无法删除。请等待教室空闲后再删除。');
      return;
    }
    
    // 设置删除记录并显示确认对话框
    setDeleteRoomRecord(record);
    setDeleteModalVisible(true);
  };

  // 删除教室前的检查


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
      'cleaning': 'CLEANING',
      'pending_cleaning': 'PENDING_CLEANING',
      'pending_maintenance': 'PENDING_MAINTENANCE'
    };
    
    const newParams = {
      ...searchParams,
      pageNum: 1,
      status: value === 'all' ? undefined : statusMapping[value],
    };
    setSearchParams(newParams);
    debounce(() => fetchRooms(newParams));
  };

  // 打开新增教室抽屉
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
    
    // 获取教室未来的已批准预约
    try {
      const response = await applicationAPI.getFutureApprovedApplications(record.id);
      console.log('详情抽屉未来预约数据:', response.data);
      setFutureApplications(response.data || []);
    } catch (error) {
      console.error('获取未来预约失败:', error);
      setFutureApplications([]);
    }
  };

  // 打开申请教室抽屉
  const handleApply = async (record) => {
    setDrawerType('apply');
    setCurrentRoom(record);
    form.resetFields();
    // 预填充教室信息
    form.setFieldsValue({
      room: record.id,
      roomName: record.name,
      roomLocation: record.location
    });
    setDrawerVisible(true);
    
    // 获取教室未来的已批准预约
    try {
      const response = await applicationAPI.getFutureApprovedApplications(record.id);
      console.log('未来预约数据:', response.data);
      setFutureApplications(response.data || []);
    } catch (error) {
      console.error('获取未来预约失败:', error);
      setFutureApplications([]);
    }
  };

  // 打开编辑教室抽屉
  const handleEditRoom = (record) => {
    setDrawerType('edit');
    setCurrentRoom(record);
    form.resetFields();
    
    // 使用hook获取教室详细信息
    const fetchRoomDetails = async () => {
      try {
        const response = await roomAPI.getRoomById(record.id);
        const roomDetails = response.data;
        
        // 预填充教室信息
        const formValues = {
          name: roomDetails.name,
          type: getRoomTypeFrontendValue(roomDetails.type), // 转换为前端值
          capacity: roomDetails.capacity,
          location: roomDetails.location,
          description: roomDetails.description,
          status: roomDetails.status
        };
        
        form.setFieldsValue(formValues);
        setCurrentRoom(roomDetails);
        setDrawerVisible(true);
      } catch (error) {
        console.error('获取教室详情失败:', error);
        messageApi.error('获取教室详情失败');
      }
    };
    
    fetchRoomDetails();
  };

  // 监听表单变化，计算变更
  const handleFormChange = (changedFields, allFields) => {
    if (drawerType === 'edit' && currentRoom) {
      const changes = [];
      
      // 比较各个字段的变化
      if (currentRoom.name !== allFields.name) {
        changes.push(`名称：${currentRoom.name} → ${allFields.name}`);
      } else {
        changes.push(`名称：${currentRoom.name}`);
      }
      
      if (currentRoom.type !== getRoomTypeEnumValue(allFields.type)) {
        changes.push(`类型：${getRoomTypeDisplayName(currentRoom.type)} → ${getRoomTypeDisplayName(getRoomTypeEnumValue(allFields.type))}`);
      } else {
        changes.push(`类型：${getRoomTypeDisplayName(currentRoom.type)}`);
      }
      
      if (currentRoom.capacity !== allFields.capacity) {
        changes.push(`容量：${currentRoom.capacity}人 → ${allFields.capacity}人`);
      } else {
        changes.push(`容量：${currentRoom.capacity}人`);
      }
      
      if (currentRoom.location !== allFields.location) {
        changes.push(`位置：${currentRoom.location} → ${allFields.location}`);
      } else {
        changes.push(`位置：${currentRoom.location}`);
      }
      
      if (currentRoom.status !== allFields.status) {
        changes.push(`状态：${getRoomStatusDisplayName(currentRoom.status)} → ${getRoomStatusDisplayName(allFields.status)}`);
      } else {
        changes.push(`状态：${getRoomStatusDisplayName(currentRoom.status)}`);
      }
      
      if (currentRoom.description !== allFields.description) {
        const oldDesc = currentRoom.description || '无';
        const newDesc = allFields.description || '无';
        changes.push(`描述：${oldDesc} → ${newDesc}`);
      } else {
        changes.push(`描述：${currentRoom.description || '无'}`);
      }
      

    }
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setDrawerType('');
    setCurrentRoom(null);
    form.resetFields();
    setEditFormValues({});
    setDeleteRoomRecord(null);
  };

    // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (drawerType === 'edit') {
        // 获取当前表单值并显示确认对话框
        const currentFormValues = form.getFieldsValue();
        setEditFormValues(currentFormValues);
        setConfirmModalVisible(true);
        return false; // 阻止表单提交
      }
      
      if (drawerType === 'add') {
        await executeWithRetry(
          async () => {
            const roomData = {
              ...values,
              type: getRoomTypeEnumValue(values.type)
            };
            const response = await roomAPI.createRoom(roomData);
            messageApi.success('教室创建成功');
            handleCloseDrawer();
            fetchRooms(); // 刷新列表
            return response;
          },
          {
            errorMessage: '创建教室失败',
            successMessage: '教室创建成功'
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
            
            messageApi.success('申请提交成功，正在跳转到申请列表...', 0.5).then(() => {
              handleCloseDrawer();
              if (user?.role === 'APPLIER') {
                navigate('/my-applications');
              } else if (user?.role === 'ADMIN') {
                navigate('/application-management');
              } else {
                navigate('/rooms');
              }
            });
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
      render: (status) => (
        <Tag color={getRoomStatusColor(status)}>
          {getRoomStatusDisplayName(status)}
        </Tag>
      ),
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
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {canUpdateRoom(user?.role) && (
            <Tooltip title="编辑教室">
              <Button 
                type="text" 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => handleEditRoom(record)}
              />
            </Tooltip>
          )}
          {canCreateApplication(user?.role) && (
            <Tooltip title="申请教室">
              <Button 
                type="text" 
                size="small" 
                icon={<FileTextOutlined />}
                onClick={() => handleApply(record)}
              />
            </Tooltip>
          )}
          {canDeleteRoom(user?.role) && (
            <Tooltip 
              title={
                record.status === 'USING' || record.status === 'RESERVED' 
                  ? '教室正在使用中，无法删除' 
                  : '删除教室'
              }
            >
              <Button 
                type="text" 
                size="small" 
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('删除按钮被点击，教室:', record);
                  console.log('用户角色:', user?.role);
                  console.log('是否有删除权限:', canDeleteRoom(user?.role));
                  handleDeleteRoom(record);
                }}
                disabled={record.status === 'USING' || record.status === 'RESERVED'}
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
                添加教室
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
            {/* 教室搜索 */}
            <div style={{ minWidth: '200px' }}>
              <Input
                placeholder="搜索教室名称"
                allowClear
                style={{ width: '100%' }}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            {/* 教室类型筛选 */}
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
            
            {/* 教室状态筛选 */}
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
                <Option value="reserved">已预约</Option>
                <Option value="using">使用中</Option>
                <Option value="maintenance">维修中</Option>
                <Option value="cleaning">清洁中</Option>
                <Option value="pending_cleaning">待清洁</Option>
                <Option value="pending_maintenance">待维修</Option>
                <Option value="unavailable">不可用</Option>
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
                  dataSource={rooms}
                  rowKey="id"
                  loading={loading}
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
                fetchRooms(newParams);
              }}
            />
          </div>
        </div>
      </Card>

      {/* 抽屉组件 */}
      <Drawer
        title={
          drawerType === 'add' ? '新增教室' :
          drawerType === 'edit' ? '编辑教室' :
          drawerType === 'detail' ? '教室详情' :
          drawerType === 'apply' ? '申请教室' : ''
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
              {drawerType === 'edit' ? (
                <Button type="primary" onClick={() => form.submit()}>
                  确认
                </Button>
              ) : (
                <Button type="primary" onClick={() => form.submit()}>
                  {drawerType === 'add' ? '创建' : '提交申请'}
                </Button>
              )}
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
              label="教室名称"
              rules={[{ required: true, message: '请输入教室名称' }]}
            >
              <Input placeholder="请输入教室名称" />
            </Form.Item>
            
            <Form.Item
              name="type"
              label="教室类型"
              rules={[{ required: true, message: '请选择教室类型' }]}
            >
              <Select placeholder="请选择教室类型">
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
              <Input.TextArea rows={4} placeholder="请输入教室描述" />
            </Form.Item>
          </Form>
        )}

        {drawerType === 'edit' && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onFieldsChange={handleFormChange}
          >
            <Form.Item
              name="name"
              label="教室名称"
              rules={[{ required: true, message: '请输入教室名称' }]}
            >
              <Input placeholder="请输入教室名称" />
            </Form.Item>
            
            <Form.Item
              name="type"
              label="教室类型"
              rules={[{ required: true, message: '请选择教室类型' }]}
            >
              <Select placeholder="请选择教室类型">
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
              name="status"
              label="教室状态"
              rules={[{ required: true, message: '请选择教室状态' }]}
            >
              <Select placeholder="请选择教室状态">
                {roomStatusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Tag color={getRoomStatusColor(option.value)}>{option.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={4} placeholder="请输入教室描述" />
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
                  <strong>教室名称：</strong>
                  <span>{currentRoom.name}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>教室类型：</strong>
                  <span>{getRoomTypeDisplayName(currentRoom.type)}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>容量：</strong>
                  <span>{currentRoom.capacity}人</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>状态：</strong>
                  <Tag color={getRoomStatusColor(currentRoom.status)}>
                    {getRoomStatusDisplayName(currentRoom.status)}
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
              <p style={{ color: 'var(--text-color)' }}><strong>教室名称：</strong>{currentRoom.name}</p>
              <p style={{ color: 'var(--text-color)' }}><strong>教室类型：</strong>{getRoomTypeDisplayName(currentRoom.type)}</p>
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
                label="使用人数"
                rules={[{ required: true, message: '请输入使用人数' }]}
              >
                <InputNumber
                  min={1}
                  max={currentRoom.capacity}
                  placeholder="请输入使用人数"
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
      
      {/* 确认弹窗 */}
      <Modal
        title="确认更新教室信息"
        open={confirmModalVisible}
        onOk={async () => {
          try {
            // 重新计算变更对比
            const changes = [];
            
            // 比较各个字段的变化
            if (currentRoom.name !== editFormValues.name) {
              changes.push(`名称：${currentRoom.name} → ${editFormValues.name}`);
            } else {
              changes.push(`名称：${currentRoom.name}`);
            }
            
            if (currentRoom.type !== getRoomTypeEnumValue(editFormValues.type)) {
              changes.push(`类型：${getRoomTypeDisplayName(currentRoom.type)} → ${getRoomTypeDisplayName(getRoomTypeEnumValue(editFormValues.type))}`);
            } else {
              changes.push(`类型：${getRoomTypeDisplayName(currentRoom.type)}`);
            }
            
            if (currentRoom.capacity !== editFormValues.capacity) {
              changes.push(`容量：${currentRoom.capacity}人 → ${editFormValues.capacity}人`);
            } else {
              changes.push(`容量：${currentRoom.capacity}人`);
            }
            
            if (currentRoom.location !== editFormValues.location) {
              changes.push(`位置：${currentRoom.location} → ${editFormValues.location}`);
            } else {
              changes.push(`位置：${currentRoom.location}`);
            }
            
            if (currentRoom.status !== editFormValues.status) {
              changes.push(
                <div key="status" style={{ marginBottom: 4, fontSize: '14px' }}>
                  状态：
                  <Tag color={getRoomStatusColor(currentRoom.status)} style={{ margin: '0 4px' }}>
                    {getRoomStatusDisplayName(currentRoom.status)}
                  </Tag>
                  →
                  <Tag color={getRoomStatusColor(editFormValues.status)} style={{ margin: '0 4px' }}>
                    {getRoomStatusDisplayName(editFormValues.status)}
                  </Tag>
                </div>
              );
            } else {
              changes.push(
                <div key="status" style={{ marginBottom: 4, fontSize: '14px' }}>
                  状态：
                  <Tag color={getRoomStatusColor(currentRoom.status)} style={{ margin: '0 4px' }}>
                    {getRoomStatusDisplayName(currentRoom.status)}
                  </Tag>
                </div>
              );
            }
            
            if (currentRoom.description !== editFormValues.description) {
              const oldDesc = currentRoom.description || '无';
              const newDesc = editFormValues.description || '无';
              changes.push(`描述：${oldDesc} → ${newDesc}`);
            } else {
              changes.push(`描述：${currentRoom.description || '无'}`);
            }
            
            // 执行更新操作
            await executeWithRetry(
              async () => {
                const roomData = {
                  id: currentRoom.id,
                  name: editFormValues.name,
                  type: getRoomTypeEnumValue(editFormValues.type),
                  capacity: editFormValues.capacity,
                  location: editFormValues.location,
                  description: editFormValues.description,
                  status: editFormValues.status,
                  createTime: currentRoom.createTime,
                  updateTime: formatDateTimeForBackend(new Date())
                };
                const response = await roomAPI.updateRoom(currentRoom.id, roomData);
                messageApi.success('教室更新成功');
                handleCloseDrawer();
                fetchRooms();
                return response;
              },
              {
                errorMessage: '更新教室失败',
                successMessage: '教室更新成功'
              }
            );
          } catch (error) {
            console.error('更新失败:', error);
          } finally {
            setConfirmModalVisible(false);
            setEditFormValues({});
          }
        }}
        onCancel={() => {
          setConfirmModalVisible(false);
          setEditFormValues({});
        }}
        okText="确定更新"
        cancelText="取消"
        confirmLoading={loading}
        maskClosable={false}
        keyboard={false}
        closable={false}
        okButtonProps={{ danger: true }}
      >
        <div>
          <p>确定要更新教室信息吗？更新后可能导致一些业务无法正常进行，请谨慎操作</p>
          <div style={{ marginTop: 8 }}>
            {editFormValues.name && (
              <div>
                <p><strong>变更详情：</strong></p>
                <div style={{ marginTop: 8 }}>
                  {(() => {
                    const changes = [];
                    
                    // 比较各个字段的变化
                    if (currentRoom.name !== editFormValues.name) {
                      changes.push(`名称：${currentRoom.name} → ${editFormValues.name}`);
                    } else {
                      changes.push(`名称：${currentRoom.name}`);
                    }
                    
                    if (currentRoom.type !== getRoomTypeEnumValue(editFormValues.type)) {
                      changes.push(`类型：${getRoomTypeDisplayName(currentRoom.type)} → ${getRoomTypeDisplayName(getRoomTypeEnumValue(editFormValues.type))}`);
                    } else {
                      changes.push(`类型：${getRoomTypeDisplayName(currentRoom.type)}`);
                    }
                    
                    if (currentRoom.capacity !== editFormValues.capacity) {
                      changes.push(`容量：${currentRoom.capacity}人 → ${editFormValues.capacity}人`);
                    } else {
                      changes.push(`容量：${currentRoom.capacity}人`);
                    }
                    
                    if (currentRoom.location !== editFormValues.location) {
                      changes.push(`位置：${currentRoom.location} → ${editFormValues.location}`);
                    } else {
                      changes.push(`位置：${currentRoom.location}`);
                    }
                    
                    if (currentRoom.status !== editFormValues.status) {
                      changes.push(
                        <div key="status" style={{ marginBottom: 4, fontSize: '14px' }}>
                          状态：
                          <Tag color={getRoomStatusColor(currentRoom.status)} style={{ margin: '0 4px' }}>
                            {getRoomStatusDisplayName(currentRoom.status)}
                          </Tag>
                          →
                          <Tag color={getRoomStatusColor(editFormValues.status)} style={{ margin: '0 4px' }}>
                            {getRoomStatusDisplayName(editFormValues.status)}
                          </Tag>
                        </div>
                      );
                    } else {
                      changes.push(
                        <div key="status" style={{ marginBottom: 4, fontSize: '14px' }}>
                          状态：
                          <Tag color={getRoomStatusColor(currentRoom.status)} style={{ margin: '0 4px' }}>
                            {getRoomStatusDisplayName(currentRoom.status)}
                          </Tag>
                        </div>
                      );
                    }
                    
                    if (currentRoom.description !== editFormValues.description) {
                      const oldDesc = currentRoom.description || '无';
                      const newDesc = editFormValues.description || '无';
                      changes.push(`描述：${oldDesc} → ${newDesc}`);
                    } else {
                      changes.push(`描述：${currentRoom.description || '无'}`);
                    }
                    
                    return changes.map((change, index) => (
                      <div key={index} style={{ marginBottom: 4, fontSize: '14px' }}>
                        {change}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
      
      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除教室"
        open={deleteModalVisible}
        onOk={async () => {
          try {
            console.log('开始删除教室:', deleteRoomRecord.id);
            await executeWithRetry(
              async () => {
                const response = await roomAPI.deleteRoom(deleteRoomRecord.id);
                messageApi.success('教室删除成功');
                fetchRooms(); // 刷新列表
                return response;
              },
              {
                errorMessage: '删除教室失败',
                successMessage: '教室删除成功'
              }
            );
          } catch (error) {
            console.error('删除教室失败:', error);
            const errorMessage = error.response?.data?.message || error.message || '未知错误';
            
            // 根据错误类型显示不同的提示
            if (errorMessage.includes('相关申请记录')) {
              messageApi.error('删除失败：该教室存在相关申请记录，请先处理相关申请后再删除。');
            } else if (errorMessage.includes('正在使用中')) {
              messageApi.error('删除失败：教室正在使用中，无法删除。');
            } else if (errorMessage.includes('教室不存在')) {
              messageApi.error('删除失败：教室不存在或已被删除。');
            } else {
              messageApi.error('删除教室失败: ' + errorMessage);
            }
          } finally {
            setDeleteModalVisible(false);
            setDeleteRoomRecord(null);
          }
        }}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteRoomRecord(null);
        }}
        okText="确认删除"
        cancelText="取消"
        confirmLoading={loading}
        maskClosable={false}
        keyboard={false}
        closable={false}
        okButtonProps={{ danger: true }}
        width={500}
      >
        {deleteRoomRecord && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                确定删除以下教室？
              </p>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '6px',
                border: '1px solid #d9d9d9'
              }}>
                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>
                  教室名称：{deleteRoomRecord.name}
                </p>
                <p style={{ margin: '4px 0' }}>
                  教室类型：{getRoomTypeDisplayName(deleteRoomRecord.type)}
                </p>
                <p style={{ margin: '4px 0' }}>
                  教室位置：{deleteRoomRecord.location}
                </p>
                <p style={{ margin: '4px 0' }}>
                  教室容量：{deleteRoomRecord.capacity}人
                </p>
                <p style={{ margin: '4px 0' }}>
                  当前状态：
                  <Tag color={getRoomStatusColor(deleteRoomRecord.status)} style={{ marginLeft: '4px' }}>
                    {getRoomStatusDisplayName(deleteRoomRecord.status)}
                  </Tag>
                </p>
              </div>
            </div>
            <div style={{ 
              background: '#fff2e8', 
              padding: '12px', 
              borderRadius: '6px',
              border: '1px solid #ffd591'
            }}>
              <p style={{ color: '#d46b08', fontSize: '12px', margin: 0 }}>
                ⚠️ 警告：此操作不可恢复，删除教室将同时删除所有相关的申请记录。
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </PageErrorBoundary>
  );
} 