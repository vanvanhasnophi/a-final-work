import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Card, Button, Tag, Space, Input, Select, message, Alert, Drawer, Form, InputNumber, DatePicker, TimePicker } from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../api/room';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { useDebounce } from '../hooks/useDebounce';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

export default function RoomList() {
  const navigate = useNavigate();
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
  const [form] = Form.useForm();
  
  const { loading, error, executeWithRetry } = useApiWithRetry();
  const { debounce, clearDebounce } = useDebounce(500);
  
  // 获取房间列表
  const fetchRooms = useCallback(async (params = {}) => {
    const result = await executeWithRetry(
      async () => {
        const response = await roomAPI.getRoomList({
          ...searchParams,
          ...params,
        });
        
        const { records, total, current, size } = response.data;
        setRooms(records || []);
        setPagination({
          current: current || 1,
          pageSize: size || 10,
          total: total || 0,
        });
        
        return response.data;
      },
      {
        errorMessage: '获取房间列表失败，请检查网络连接',
        maxRetries: 2,
        retryDelay: 3000
      }
    );
    
    return result;
  }, [executeWithRetry, searchParams]);

  // 页面刷新Hook
  const handlePageRefresh = usePageRefresh(fetchRooms);
  
  // 手动重试函数
  const handleManualRetry = useCallback(() => {
    fetchRooms();
  }, [fetchRooms]);

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
    const newParams = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    setSearchParams(newParams);
    fetchRooms(newParams);
  };

  const handleSearch = (value) => {
    const newParams = {
      ...searchParams,
      pageNum: 1,
      name: value,
    };
    setSearchParams(newParams);
    debounce(() => fetchRooms(newParams));
  };

  const handleTypeFilter = (value) => {
    const newParams = {
      ...searchParams,
      pageNum: 1,
      type: value === 'all' ? undefined : value,
    };
    setSearchParams(newParams);
    debounce(() => fetchRooms(newParams));
  };

  const handleStatusFilter = (value) => {
    const newParams = {
      ...searchParams,
      pageNum: 1,
      status: value === 'all' ? undefined : value,
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
  const handleViewDetail = (record) => {
    setDrawerType('detail');
    setCurrentRoom(record);
    setDrawerVisible(true);
  };

  // 打开申请房间抽屉
  const handleApply = (record) => {
    setDrawerType('apply');
    setCurrentRoom(record);
    form.resetFields();
    setDrawerVisible(true);
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
            const response = await roomAPI.createRoom(values);
            message.success('房间创建成功');
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
        // 验证时间
        const startDate = values.startDate;
        const startTime = values.startTime;
        const endTime = values.endTime;
        
        if (startDate && startTime && endTime) {
          const startDateTime = dayjs(startDate).hour(startTime.hour()).minute(startTime.minute());
          const endDateTime = dayjs(startDate).hour(endTime.hour()).minute(endTime.minute());
          
          if (endDateTime.isBefore(startDateTime)) {
            message.error('结束时间不能早于开始时间');
            return;
          }
          
          if (endDateTime.isSame(startDateTime)) {
            message.error('结束时间不能等于开始时间');
            return;
          }
        }
        
        await executeWithRetry(
          async () => {
            const response = await roomAPI.applyRoom({
              roomId: currentRoom.id,
              startDate: values.startDate?.format('YYYY-MM-DD'),
              startTime: values.startTime?.format('HH:mm'),
              endTime: values.endTime?.format('HH:mm'),
              ...values
            });
            message.success('申请提交成功');
            handleCloseDrawer();
            fetchRooms(); // 刷新列表
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
        let color = 'success';
        if (status === '使用中'||status==='USING') color = 'warning';
        if (status === '维护中' || status === '清洁中'||status==='MAINTENANCE'||status==='CLEANING') color = 'error';
        if (status === '已预约'||status==='RESERVED') color = 'processing';
        if (status === '空闲'||status==='AVAILABLE') color = 'success';
        return <Tag color={color}>{status}</Tag>;
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
        </Space>
      ),
    },
  ];

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}
      <div style={{ padding: '24px' }}>
      <Card title="房间管理">
        {/* 错误提示和重试按钮 */}
        {error && (
          <Alert
            message="数据获取失败"
            description={error}
            type="error"
            showIcon
            action={
              <Button 
                size="small" 
                danger 
                icon={<ReloadOutlined />}
                onClick={handleManualRetry}
                loading={loading}
              >
                重试
              </Button>
            }
            style={{ marginBottom: '16px' }}
          />
        )}
        
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Search
              placeholder="搜索房间"
              style={{ width: 200 }}
              onSearch={handleSearch}
              allowClear
            />
            <Select defaultValue="all" style={{ width: 120 }} onChange={handleTypeFilter}>
              <Option value="all">全部类型</Option>
              <Option value="caseroom">案例教室</Option>
              <Option value="seminar">研讨间</Option>
              <Option value="lab">实验室</Option>
              <Option value="lecture">平面教室</Option>
            </Select>
            <Select defaultValue="all" style={{ width: 120 }} onChange={handleStatusFilter}>
              <Option value="all">全部状态</Option>
              <Option value="available">空闲</Option>
              <Option value="occupied">使用中</Option>
              <Option value="reserved">已预约</Option>
              <Option value="maintenance">维护中</Option>
              <Option value="cleaning">清洁中</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRoom}>
              添加房间
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleManualRetry}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={rooms}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
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
                <Option value="caseroom">案例教室</Option>
                <Option value="seminar">研讨间</Option>
                <Option value="lab">实验室</Option>
                <Option value="lecture">平面教室</Option>
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
            <div style={{ marginBottom: 16 }}>
              <strong>房间名称：</strong>
              <span>{currentRoom.name}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>房间类型：</strong>
              <span>{currentRoom.type}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>容量：</strong>
              <span>{currentRoom.capacity}人</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>状态：</strong>
              <Tag color={
                currentRoom.status === '空闲' ? 'green' :
                currentRoom.status === '使用中' ? 'orange' :
                currentRoom.status === '已预约' ? 'blue' :
                currentRoom.status === '维护中' || currentRoom.status === '清洁中' ? 'red' : 'default'
              }>
                {currentRoom.status}
              </Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>位置：</strong>
              <span>{currentRoom.location}</span>
            </div>
            {currentRoom.description && (
              <div style={{ marginBottom: 16 }}>
                <strong>描述：</strong>
                <p>{currentRoom.description}</p>
              </div>
            )}
          </div>
        )}

        {drawerType === 'apply' && currentRoom && (
          <div>
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
              <h4>申请房间信息</h4>
              <p><strong>房间名称：</strong>{currentRoom.name}</p>
              <p><strong>房间类型：</strong>{currentRoom.type}</p>
              <p><strong>容量：</strong>{currentRoom.capacity}人</p>
              <p><strong>位置：</strong>{currentRoom.location}</p>
            </div>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="purpose"
                label="使用目的"
                rules={[{ required: true, message: '请输入使用目的' }]}
              >
                <Input.TextArea rows={3} placeholder="请详细描述使用目的" />
              </Form.Item>
              
              <Form.Item
                name="startDate"
                label="开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  disabledDate={(current) => {
                    return current && current < dayjs().startOf('day');
                  }}
                />
              </Form.Item>
              
              <Form.Item
                name="startTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                  minuteStep={15}
                  showNow={false}
                />
              </Form.Item>
              
              <Form.Item
                name="endTime"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                  minuteStep={15}
                  showNow={false}
                />
              </Form.Item>
              
              <Form.Item
                name="attendees"
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