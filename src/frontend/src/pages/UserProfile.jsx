import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, Row, Col, Divider, List, Tag, Space, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { userAPI } from '../api/user';

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 获取用户信息
  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getCurrentUser();
      setUserInfo(response.data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      messageApi.open({
        type: 'error',
        content: '获取用户信息失败',
        duration: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    form.setFieldsValue(userInfo);
  };

  const handleSave = async (values) => {
    try {
      await userAPI.updateUser(userInfo.id, values);
      messageApi.open({
        type: 'success',
        content: '用户信息更新成功',
        duration: 2,
      });
      setIsEditing(false);
      fetchUserInfo(); // 刷新用户信息
    } catch (error) {
      console.error('更新用户信息失败:', error);
      messageApi.open({
        type: 'error',
        content: '更新用户信息失败',
        duration: 2,
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
  };

  // 模拟最近活动数据
  const recentActivities = [
    {
      id: 1,
      action: '申请了会议室A',
      time: '2024-01-14 15:30',
      status: '待审批'
    },
    {
      id: 2,
      action: '使用了培训室',
      time: '2024-01-13 14:00-17:00',
      status: '已完成'
    },
    {
      id: 3,
      action: '申请了会议室B',
      time: '2024-01-12 10:20',
      status: '已批准'
    }
  ];

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!userInfo) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>用户信息不存在</div>;
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
      <Row gutter={24}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Avatar size={80} icon={<UserOutlined />} />
              <h2 style={{ marginTop: '16px' }}>{userInfo.nickname || userInfo.username}</h2>
              <Tag color="processing">{userInfo.role || '普通用户'}</Tag>
            </div>

            <List
              size="small"
              dataSource={[
                { label: '用户名', value: userInfo.username },
                { label: '邮箱', value: userInfo.email },
                { label: '电话', value: userInfo.phone },
                { label: '部门', value: userInfo.department }
              ]}
              renderItem={item => (
                <List.Item>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{item.label}:</span>
                  <span>{item.value || '未设置'}</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={16}>
          <Card 
            title="个人信息" 
            extra={
              isEditing ? (
                <Space>
                  <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
                    保存
                  </Button>
                  <Button onClick={handleCancel}>取消</Button>
                </Space>
              ) : (
                <Button icon={<EditOutlined />} onClick={handleEdit}>
                  编辑
                </Button>
              )
            }
          >
            {isEditing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="nickname"
                      label="昵称"
                      rules={[{ required: true, message: '请输入昵称' }]}
                    >
                      <Input prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="username"
                      label="用户名"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input disabled />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      label="邮箱"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' }
                      ]}
                    >
                      <Input prefix={<MailOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="phone"
                      label="电话"
                      rules={[{ required: true, message: '请输入电话' }]}
                    >
                      <Input prefix={<PhoneOutlined />} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="department"
                  label="部门"
                  rules={[{ required: true, message: '请输入部门' }]}
                >
                  <Input />
                </Form.Item>
              </Form>
            ) : (
              <div>
                <p><strong>昵称:</strong> {userInfo.nickname || '未设置'}</p>
                <p><strong>用户名:</strong> {userInfo.username}</p>
                <p><strong>邮箱:</strong> {userInfo.email || '未设置'}</p>
                <p><strong>电话:</strong> {userInfo.phone || '未设置'}</p>
                <p><strong>部门:</strong> {userInfo.department || '未设置'}</p>
              </div>
            )}
          </Card>

          <Divider />

          <Card title="最近活动">
            <List
              dataSource={recentActivities}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.action}
                    description={item.time}
                  />
                  <Tag color={item.status === '已完成' ? 'success' : item.status === '已批准' ? 'processing' : 'warning'}>
                    {item.status}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
    </>
  );
} 