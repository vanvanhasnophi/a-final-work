import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Form, Input, DatePicker, Select, message } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { applicationAPI } from '../api/application';
import { roomAPI } from '../api/room';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 获取申请列表
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await applicationAPI.getAllApplications();
      setApplications(response.data || []);
    } catch (error) {
      console.error('获取申请列表失败:', error);
      message.error('获取申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取房间列表（用于下拉选择）
  const fetchRooms = async () => {
    try {
      const response = await roomAPI.getRoomList({ pageSize: 100 });
      setRooms(response.data.records || []);
    } catch (error) {
      console.error('获取房间列表失败:', error);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchRooms();
  }, []);

  const handleSubmit = async (values) => {
    try {
      // 处理时间范围
      const [startTime, endTime] = values.timeRange;
      const applicationData = {
        ...values,
        startTime: startTime.format('YYYY-MM-DD HH:mm:ss'),
        endTime: endTime.format('YYYY-MM-DD HH:mm:ss'),
        roomId: values.room,
      };
      
      await applicationAPI.createApplication(applicationData);
      message.success('申请提交成功');
      setIsModalVisible(false);
      form.resetFields();
      fetchApplications(); // 刷新列表
    } catch (error) {
      console.error('提交申请失败:', error);
      message.error('提交申请失败');
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
          <Button type="link" icon={<EyeOutlined />} size="small">
            查看详情
          </Button>
          {record.status === '待审批' && (
            <>
              <Button type="link" icon={<CheckOutlined />} size="small" style={{ color: '#52c41a' }}>
                批准
              </Button>
              <Button type="link" icon={<CloseOutlined />} size="small" danger>
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title="申请管理" 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            新建申请
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="id"
          loading={loading}
          pagination={{
            total: applications.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title="新建申请"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
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
            />
          </Form.Item>

          <Form.Item
            name="purpose"
            label="使用用途"
            rules={[{ required: true, message: '请输入使用用途' }]}
          >
            <Input.TextArea rows={3} placeholder="请详细描述使用用途" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交申请
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 