import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Button, Space, Drawer, Form, Input, DatePicker, Select, message, Alert, InputNumber, TimePicker, Tag } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { applicationAPI } from '../api/application';
import { roomAPI } from '../api/room';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
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

  // 获取申请列表
  const fetchApplications = useCallback(async () => {
    const result = await executeApplications(
      async () => {
        const response = await applicationAPI.getAllApplications();
        setApplications(response.data || []);
        return response.data;
      },
      {
        errorMessage: '获取申请列表失败，请检查网络连接',
        maxRetries: 2,
        retryDelay: 3000
      }
    );
    return result;
  }, [executeApplications]);

  // 获取房间列表（用于下拉选择）
  const fetchRooms = useCallback(async () => {
    const result = await executeRooms(
      async () => {
        const response = await roomAPI.getRoomList({ pageSize: 100 });
        setRooms(response.data.records || []);
        return response.data.records;
      },
      {
        errorMessage: '获取房间列表失败',
        maxRetries: 2,
        retryDelay: 3000,
        showRetryMessage: false
      }
    );
    return result;
  }, [executeRooms]);

  // 初始化加载
  useEffect(() => {
    fetchApplications();
    fetchRooms();
  }, []); // 只在组件挂载时执行一次

  // 打开新增申请抽屉
  const handleAddApplication = () => {
    setDrawerType('add');
    setCurrentApplication(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  // 打开查看详情抽屉
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
        const applicationData = {
          ...values,
          startTime: startTime.format('YYYY-MM-DD HH:mm:ss'),
          endTime: endTime.format('YYYY-MM-DD HH:mm:ss'),
          roomId: values.room,
        };
        
        await executeApplications(
          async () => {
            const response = await applicationAPI.createApplication(applicationData);
            message.success('申请提交成功');
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
            message.success(values.approved ? '申请已批准' : '申请已拒绝');
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
      title: '房间名称',
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
    },
    {
      title: '使用时间',
      key: 'time',
      render: (_, record) => (
        <div>
          <div>{record.startTime}</div>
          <div>至 {record.endTime}</div>
        </div>
      ),
    },
    {
      title: '用途',
      dataIndex: 'purpose',
      key: 'purpose',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'processing';
        if (status === '已批准') color = 'success';
        if (status === '已拒绝') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          {record.status === '待审批' && (
            <Button 
              type="link" 
              icon={<CheckOutlined />} 
              size="small" 
              style={{ color: '#52c41a' }}
              onClick={() => handleApprove(record)}
            >
              审批
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}
      <div style={{ padding: '24px' }}>
      <Card 
        title="申请管理" 
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchApplications}
              loading={applicationsLoading}
            >
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddApplication}>
              新建申请
            </Button>
          </Space>
        }
      >
        {/* 错误提示 */}
        {(applicationsError || roomsError) && (
          <Alert
            message="数据获取失败"
            description={applicationsError || roomsError}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="id"
          loading={applicationsLoading}
          pagination={{
            total: applications.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
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
              label="选择房间"
              rules={[{ required: true, message: '请选择房间' }]}
            >
              <Select placeholder="请选择房间">
                {rooms.map(room => (
                  <Option key={room.id} value={room.id}>
                    {room.name} ({room.location})
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
              />
            </Form.Item>

            <Form.Item
              name="purpose"
              label="使用用途"
              rules={[{ required: true, message: '请输入使用用途' }]}
            >
              <Input.TextArea rows={3} placeholder="请详细描述使用用途" />
            </Form.Item>

            <Form.Item
              name="attendees"
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
              <strong>申请房间：</strong>
              <span>{currentApplication.roomName}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>申请人：</strong>
              <span>{currentApplication.applicantName}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>使用时间：</strong>
              <div>
                <div>开始：{currentApplication.startTime}</div>
                <div>结束：{currentApplication.endTime}</div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>用途：</strong>
              <p>{currentApplication.purpose}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>状态：</strong>
              <Tag color={
                currentApplication.status === '待审批'||currentApplication.status==='PENDING' ? 'processing' :
                currentApplication.status === '已批准'||currentApplication.status==='APPROVED' ? 'success' :
                currentApplication.status === '已拒绝'||currentApplication.status==='REJECTED' ? 'error' : 'default'
              }>
                {currentApplication.status}
              </Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>申请时间：</strong>
              <span>{currentApplication.createTime}</span>
            </div>
            {currentApplication.attendees && (
              <div style={{ marginBottom: 16 }}>
                <strong>参与人数：</strong>
                <span>{currentApplication.attendees}人</span>
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
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
              <h4>申请信息</h4>
              <p><strong>申请房间：</strong>{currentApplication.roomName}</p>
              <p><strong>申请人：</strong>{currentApplication.applicantName}</p>
              <p><strong>使用时间：</strong>{currentApplication.startTime} 至 {currentApplication.endTime}</p>
              <p><strong>用途：</strong>{currentApplication.purpose}</p>
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