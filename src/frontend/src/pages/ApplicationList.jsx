import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Form, Input, DatePicker, Select } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 模拟数据
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setApplications([
        {
          id: 1,
          roomName: '会议室A',
          applicant: '张三',
          startTime: '2024-01-15 09:00',
          endTime: '2024-01-15 11:00',
          purpose: '项目讨论会议',
          status: '待审批',
          createTime: '2024-01-14 15:30'
        },
        {
          id: 2,
          roomName: '培训室',
          applicant: '李四',
          startTime: '2024-01-16 14:00',
          endTime: '2024-01-16 17:00',
          purpose: '新员工培训',
          status: '已批准',
          createTime: '2024-01-14 10:20'
        },
        {
          id: 3,
          roomName: '会议室B',
          applicant: '王五',
          startTime: '2024-01-17 13:00',
          endTime: '2024-01-17 15:00',
          purpose: '客户会议',
          status: '已拒绝',
          createTime: '2024-01-14 16:45'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const columns = [
    {
      title: '房间名称',
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
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

  const handleSubmit = (values) => {
    console.log('申请表单:', values);
    setIsModalVisible(false);
    form.resetFields();
  };

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
              <Option value="meeting-a">会议室A</Option>
              <Option value="meeting-b">会议室B</Option>
              <Option value="training">培训室</Option>
              <Option value="small-meeting">小会议室</Option>
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