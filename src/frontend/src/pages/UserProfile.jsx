import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Avatar, Row, Col, Divider, List, Tag, Space, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { userAPI } from '../api/user';
import { getRoleDisplayName } from '../utils/roleMapping';
import { getApplicationStatusDisplayName, getApplicationStatusColor } from '../utils/statusMapping';
import { formatDateTime, formatRelativeTime } from '../utils/dateFormat';
import { useAuth } from '../contexts/AuthContext';

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { updateUserInfo, refreshUserInfo } = useAuth();



  // 获取用户信息
  const fetchUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      // 使用AuthContext的refreshUserInfo来获取最新用户信息
      const userData = await refreshUserInfo();
      setUserInfo(userData);
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
  }, [messageApi, refreshUserInfo]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const handleEdit = () => {
    setIsEditing(true);
    form.setFieldsValue(userInfo);
  };

  const handleSave = async (values) => {
    try {
      // 确保包含用户ID
      const updateData = {
        ...values,
        id: userInfo.id,
        role: userInfo.role // 保持原有角色不变
      };
      
      await userAPI.updateUser(userInfo.id, updateData);
      
      // 更新AuthContext中的用户信息
      const updatedUserData = {
        ...userInfo,
        ...values
      };
      updateUserInfo(updatedUserData);
      
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
      status: 'PENDING'
    },
    {
      id: 2,
      action: '使用了培训室',
      time: '2024-01-13 14:00-17:00',
      status: 'COMPLETED'
    },
    {
      id: 3,
      action: '申请了会议室B',
      time: '2024-01-12 10:20',
      status: 'APPROVED'
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
              <Tag color="processing">{getRoleDisplayName(userInfo.role)}</Tag>
            </div>

            <List
              size="small"
              dataSource={[
                { label: 'id', value: userInfo.id },
                { label: '用户名', value: userInfo.username },
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
                    name="department"
                    label="部门"
                    rules={[{ required: true, message: '请输入部门' }]}
                  >
                  <Input />
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

                
              </Form>
            ) : (
              <div>
                <p><strong>昵称:</strong> {userInfo.nickname || '未设置'}</p>
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
                    description={formatDateTime(item.time)}
                  />
                  <Tag color={getApplicationStatusColor(item.status)}>
                    {getApplicationStatusDisplayName(item.status)}
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