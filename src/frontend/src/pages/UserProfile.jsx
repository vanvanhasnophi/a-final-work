import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Avatar, Row, Col, Divider, List, Tag, Space, message, Select, Alert, Modal } from 'antd';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, SaveOutlined, BankOutlined, ToolOutlined, SettingOutlined, LockOutlined } from '@ant-design/icons';
import { userAPI } from '../api/user';
import { getRoleDisplayName } from '../utils/roleMapping';
import { getPermissionDisplayName } from '../utils/permissionMapping';
import { getApplicationStatusDisplayName, getApplicationStatusColor } from '../utils/statusMapping';
import { formatDateTime, formatRelativeTime } from '../utils/dateFormat';
import { useAuth } from '../contexts/AuthContext';
import RecentActivities from '../components/RecentActivities';
import { useActivities } from '../hooks/useActivities';
import ActivityGenerator from '../utils/activityGenerator';

const { Option } = Select;

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [newPwd, setNewPwd] = useState('');
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { updateUserInfo, refreshUserInfo } = useAuth();
  
  // 使用活动Hook
  const { 
    activities: userActivities, 
    loading: activitiesLoading, 
    refreshActivities: fetchUserActivities 
  } = useActivities({
    type: 'all',
    userId: userInfo?.id,
    userRole: userInfo?.role,
    limit: 8,
    autoRefresh: false
  });

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

  // 移除重复的活动获取逻辑，使用Hook

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
      
      // 生成用户更新活动
      ActivityGenerator.userUpdated(updatedUserData);
      
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

  // 修改密码相关函数
  const handleChangePassword = () => {
    setPasswordModalVisible(true);
    passwordForm.resetFields();
  };

  const handlePasswordSubmit = async (values) => {
    try {
      await userAPI.updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      
      messageApi.open({
        type: 'success',
        content: '密码修改成功',
        duration: 2,
      });
      
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error('修改密码失败:', error);
      let errMsg = '修改密码失败';
      const data = error.response?.data;
      if (data) {
        if (typeof data === 'string') {
          errMsg = data;
        } else if (data.message) {
          errMsg = data.message;
        } else if (data.code) {
          errMsg = data.code;
        }
      } else if (error.message) {
        errMsg = error.message;
      }
      messageApi.open({
        type: 'error',
        content: errMsg,
        duration: 2,
      });
    }
  };

  const handlePasswordCancel = () => {
    setPasswordModalVisible(false);
    passwordForm.resetFields();
  };

  // 移除模拟活动数据，使用真实的活动服务

  // 根据角色获取特有字段的显示组件
  const getRoleSpecificFields = () => {
    if (!userInfo) return null;

    switch (userInfo.role) {
      case 'APPLIER':
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label="部门"
                rules={[{ required: true, message: '请输入部门' }]}
              >
                <Input prefix={<BankOutlined />} placeholder="请输入部门" />
              </Form.Item>
            </Col>
          </Row>
        );
      
      case 'APPROVER':
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="permission"
                label="审批权限"
              >
                <Select placeholder="请选择审批权限">
                  <Option value="READ_ONLY">只读</Option>
                  <Option value="RESTRICTED">受限</Option>
                  <Option value="NORMAL">正常</Option>
                  <Option value="EXTENDED">扩展</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        );
      
      case 'SERVICE':
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="serviceArea"
                label="负责区域"
                rules={[{ required: true, message: '请输入负责区域' }]}
              >
                <Input prefix={<SettingOutlined />} placeholder="请输入负责区域" />
              </Form.Item>
            </Col>
          </Row>
        );
      
      case 'MAINTAINER':
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="skill"
                label="维修范围"
                rules={[{ required: true, message: '请输入维修范围' }]}
              >
                <Input prefix={<ToolOutlined />} placeholder="请输入维修范围" />
              </Form.Item>
            </Col>
          </Row>
        );
      
      default:
        return null;
    }
  };

  // 根据角色获取特有字段的显示信息
  const getRoleSpecificInfo = () => {
    if (!userInfo) return null;

    switch (userInfo.role) {
      case 'APPLIER':
        return (
          <div style={{ marginBottom: '12px' }}>
            <strong>部门:</strong> {userInfo.department || '未设置'}
          </div>
        );
      
      case 'APPROVER':
        return (
          <div style={{ marginBottom: '12px' }}>
            <strong>审批权限:</strong> {getPermissionDisplayName(userInfo.permission)}
          </div>
        );
      
      case 'SERVICE':
        return (
          <div style={{ marginBottom: '12px' }}>
            <strong>负责区域:</strong> {userInfo.serviceArea || '未设置'}
          </div>
        );
      
      case 'MAINTAINER':
        return (
          <div style={{ marginBottom: '12px' }}>
            <strong>维修范围:</strong> {userInfo.skill || '未设置'}
          </div>
        );
      
      default:
        return null;
    }
  };

  // 获取角色颜色
  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'APPROVER': return 'blue';
      case 'APPLIER': return 'green';
      case 'SERVICE': return 'orange';
      case 'MAINTAINER': return 'purple';
      default: return 'default';
    }
  };

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
                <Tag color={getRoleColor(userInfo.role)}>{getRoleDisplayName(userInfo.role)}</Tag>
              </div>

              <List
                size="small"
                dataSource={[
                  { label: 'ID', value: userInfo.id },
                  { label: '用户名', value: userInfo.username },
                  { label: '角色', value: getRoleDisplayName(userInfo.role) },
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
                  <Space>
                    <Button icon={<EditOutlined />} onClick={handleEdit}>
                      编辑
                    </Button>
                    <Button icon={<LockOutlined />} onClick={handleChangePassword}>
                      修改密码
                    </Button>
                  </Space>
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
                        <Input prefix={<UserOutlined />} placeholder="请输入昵称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="email"
                        label="邮箱"
                        rules={[
                          { required: true, message: '请输入邮箱' },
                          { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                      >
                        <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="phone"
                        label="电话"
                        rules={[{ required: true, message: '请输入电话' }]}
                      >
                        <Input prefix={<PhoneOutlined />} placeholder="请输入电话" />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* 根据角色显示特有字段 */}
                  {getRoleSpecificFields()}
                </Form>
              ) : (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>昵称:</strong> {userInfo.nickname || '未设置'}
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>邮箱:</strong> {userInfo.email || '未设置'}
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>电话:</strong> {userInfo.phone || '未设置'}
                  </div>
                  {/* 根据角色显示特有信息 */}
                  {getRoleSpecificInfo()}
                </div>
              )}
            </Card>

            <Divider />

            <Card title="最近活动" extra={
              <Button 
                type="link" 
                size="small" 
                onClick={fetchUserActivities}
                loading={activitiesLoading}
              >
                刷新
              </Button>
            }>
              <RecentActivities
                activities={userActivities}
                loading={activitiesLoading}
                maxItems={8}
                showAvatar={false}
                showTime={true}
                showType={true}
                compact={false}
                emptyText="暂无最近活动"
                height="calc(100vh - 450px)"
                minHeight="200px"
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onOk={() => passwordForm.submit()}
        onCancel={handlePasswordCancel}
        okText="确认修改"
        cancelText="取消"
        maskClosable={false}
        keyboard={false}
        closable={false}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordSubmit}
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[
              { required: true, message: '请输入当前密码' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入当前密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度至少8位' },
              { validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const parts = [
                    value.length >= 8,
                    /[A-Z]/.test(value),
                    /[a-z]/.test(value),
                    /[0-9]/.test(value),
                    /[!@#$%^&*()_+\-={}[\]|:;"'<>.,?/]/.test(value)
                  ].filter(Boolean).length;
                  if (parts >= 2 && value.length >= 8) return Promise.resolve();
                  return Promise.reject(new Error('需至少8位且至少满足任意2类: 大写/小写/数字/特殊'));
                }
              }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入新密码"
              size="large"
              onChange={(e)=> setNewPwd(e.target.value)}
            />
          </Form.Item>
          <PasswordStrengthMeter password={newPwd} compact />

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请确认新密码"
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
} 