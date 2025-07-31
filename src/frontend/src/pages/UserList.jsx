import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Card, Button, Space, Drawer, Form, Input, DatePicker, Select, message, Alert, Tag, Pagination } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { userAPI } from '../api/user';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { getRoleDisplayName } from '../utils/roleMapping';
import { useDebounceSearchV2 } from '../hooks/useDebounceSearchV2';
import { formatDateTime } from '../utils/dateFormat';

const { Option } = Select;

export default function UserList() {
  const [users, setUsers] = useState([]);
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
  const roleSelectRef = useRef(null);
  const [selectedRole, setSelectedRole] = useState(undefined);

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'detail', 'edit'
  const [currentUser, setCurrentUser] = useState(null);
  
  const { loading: usersLoading, error: usersError, executeWithRetry: executeUsers } = useApiWithRetry();
  
  // 页面刷新Hook
  const handlePageRefresh = usePageRefresh(() => {
    fetchUsers();
  });
  
  // 防抖搜索Hook
  const usernameSearch = useDebounceSearchV2((value) => {
    const newParams = { username: value || undefined, pageNum: 1 };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchUsers(newParams);
  }, 500);
  
  const nicknameSearch = useDebounceSearchV2((value) => {
    const newParams = { nickname: value || undefined, pageNum: 1 };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchUsers(newParams);
  }, 500);

  // 获取用户列表
  const fetchUsers = useCallback(async (params = {}) => {
    const result = await executeUsers(
      async () => {
        // 获取当前的searchParams，避免闭包问题
        const currentSearchParams = searchParams;
        const requestParams = {
          ...currentSearchParams,
          ...params,
        };
        
        console.log('发送用户分页请求参数:', requestParams);
        const response = await userAPI.getUserList(requestParams);
        
        const { records, total, pageNum, pageSize } = response.data;
        console.log('用户分页响应数据:', response.data);
        
        setUsers(records || []);
        setPagination({
          current: pageNum || 1,
          pageSize: pageSize || 10,
          total: total || 0,
        });
        
        return response.data;
      },
      {
        errorMessage: '获取用户列表失败，请检查网络连接',
        maxRetries: 0, // 不重试，避免反复请求
        retryDelay: 0
      }
    );
    return result;
  }, [executeUsers]); // 移除searchParams依赖

  // 初始化加载
  useEffect(() => {
    fetchUsers();
  }, []); // 只在组件挂载时执行一次

  // 处理表格分页变化
  const handleTableChange = (pagination, filters, sorter) => {
    console.log('用户表格分页变化:', pagination);
    const newParams = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchUsers(newParams);
  };

  // 打开查看详情抽屉
  const handleViewDetail = (record) => {
    setDrawerType('detail');
    setCurrentUser(record);
    setDrawerVisible(true);
  };

  // 打开编辑抽屉
  const handleEdit = (record) => {
    setDrawerType('edit');
    setCurrentUser(record);
    form.resetFields();
    // 预填充用户信息
    form.setFieldsValue({
      nickname: record.nickname,
      email: record.email,
      phone: record.phone,
      department: record.department,
      serviceArea: record.serviceArea,
      skill: record.skill
    });
    setDrawerVisible(true);
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setDrawerType('');
    setCurrentUser(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (drawerType === 'edit') {
        await executeUsers(
          async () => {
            const userData = {
              ...currentUser,
              ...values
            };
            const response = await userAPI.updateUser(currentUser.id, userData);
            message.success('用户信息更新成功');
            handleCloseDrawer();
            fetchUsers(); // 刷新列表
            return response;
          },
          {
            errorMessage: '用户信息更新失败',
            successMessage: '用户信息更新成功'
          }
        );
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const color = role === 'ADMIN' ? 'red' : 
                     role === 'APPROVER' ? 'blue' : 
                     role === 'APPLIER' ? 'green' : 
                     role === 'SERVICE_STAFF' ? 'orange' : 'purple';
        return <Tag color={color}>{getRoleDisplayName(role)}</Tag>;
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '注册时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (createTime) => formatDateTime(createTime),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      render: (lastLoginTime) => lastLoginTime ? formatDateTime(lastLoginTime) : '-',
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
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card 
        title="用户管理" 
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                // 清空筛选控件内容
                usernameSearch.updateSearchValue('');
                nicknameSearch.updateSearchValue('');
                // 清空角色选择器
                setSelectedRole(undefined);
                // 清空搜索参数并刷新数据
                const newParams = {
                  pageNum: 1,
                  username: undefined,
                  nickname: undefined,
                  role: undefined
                };
                setSearchParams(newParams);
                fetchUsers(newParams);
              }}
              loading={usersLoading}
            >
              刷新
            </Button>
          </Space>
        }
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* 错误提示 */}
        {usersError && (
          <Alert
            message="数据获取失败"
            description={String(usersError)}
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
            {/* 用户名搜索 */}
            <div style={{ minWidth: '200px' }}>
              <Input
                placeholder="搜索用户名"
                allowClear
                style={{ width: '100%' }}
                value={usernameSearch.searchValue}
                onChange={(e) => usernameSearch.updateSearchValue(e.target.value)}
                onPressEnter={() => usernameSearch.searchImmediately(usernameSearch.searchValue)}
              />
            </div>
            
            {/* 昵称搜索 */}
            <div style={{ minWidth: '150px' }}>
              <Input
                placeholder="搜索昵称"
                allowClear
                style={{ width: '100%' }}
                value={nicknameSearch.searchValue}
                onChange={(e) => nicknameSearch.updateSearchValue(e.target.value)}
                onPressEnter={() => nicknameSearch.searchImmediately(nicknameSearch.searchValue)}
              />
            </div>
            
            {/* 角色筛选 */}
            <div style={{ minWidth: '120px' }}>
              <Select
                ref={roleSelectRef}
                placeholder="全部角色"
                allowClear
                style={{ width: '100%' }}
                value={selectedRole}
                onChange={(value) => {
                  setSelectedRole(value);
                  const newParams = { role: value || undefined, pageNum: 1 };
                  setSearchParams(prev => ({ ...prev, ...newParams }));
                  fetchUsers(newParams);
                }}
              >
                <Option value="ADMIN">管理员</Option>
                <Option value="APPLIER">申请人</Option>
                <Option value="APPROVER">审批人</Option>
                <Option value="SERVICE_STAFF">服务人员</Option>
                <Option value="MAINTAINER">维修人员</Option>
              </Select>
            </div>
            
            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                onClick={() => {
                  // 清空筛选控件内容
                  usernameSearch.updateSearchValue('');
                  nicknameSearch.updateSearchValue('');
                  // 清空角色选择器
                  setSelectedRole(undefined);
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
              dataSource={users}
              rowKey="id"
              loading={usersLoading}
              scroll={{ x: 800, y: '100%' }}
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
                fetchUsers(newParams);
              }}
            />
          </div>
        </div>
      </Card>

      {/* 抽屉组件 */}
      <Drawer
        title={
          drawerType === 'detail' ? '用户详情' :
          drawerType === 'edit' ? '编辑用户' : ''
        }
        width={600}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        footer={
          drawerType === 'edit' ? (
            <div style={{ textAlign: 'right' }}>
              <Button onClick={handleCloseDrawer} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" onClick={() => form.submit()}>
                保存
              </Button>
            </div>
          ) : null
        }
      >
        {drawerType === 'detail' && currentUser && (
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
                  <strong>用户名：</strong>
                  <span>{currentUser.username}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>昵称：</strong>
                  <span>{currentUser.nickname}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>角色：</strong>
                  <Tag color={
                    currentUser.role === 'ADMIN' ? 'red' : 
                    currentUser.role === 'APPROVER' ? 'blue' : 
                    currentUser.role === 'APPLIER' ? 'green' : 
                    currentUser.role === 'SERVICE_STAFF' ? 'orange' : 'purple'
                  }>
                    {getRoleDisplayName(currentUser.role)}
                  </Tag>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>邮箱：</strong>
                  <span>{currentUser.email || '-'}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>电话：</strong>
                  <span>{currentUser.phone || '-'}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>注册时间：</strong>
                  <span>{formatDateTime(currentUser.createTime)}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>最后登录：</strong>
                  <span>{currentUser.lastLoginTime ? formatDateTime(currentUser.lastLoginTime) : '-'}</span>
                </div>
                {currentUser.department && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>部门：</strong>
                    <span>{currentUser.department}</span>
                  </div>
                )}
                {currentUser.serviceArea && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>服务区域：</strong>
                    <span>{currentUser.serviceArea}</span>
                  </div>
                )}
                {currentUser.skill && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>技能：</strong>
                    <span>{currentUser.skill}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {drawerType === 'edit' && currentUser && (
          <div>
            <div style={{ 
              marginBottom: 16, 
              padding: 16, 
              backgroundColor: 'var(--component-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: 6 
            }}>
              <p style={{ color: 'var(--text-color)' }}><strong>用户名：</strong>{currentUser.username}</p>
              <p style={{ color: 'var(--text-color)' }}><strong>角色：</strong>
                <Tag color={
                  currentUser.role === 'ADMIN' ? 'red' : 
                  currentUser.role === 'APPROVER' ? 'blue' : 
                  currentUser.role === 'APPLIER' ? 'green' : 
                  currentUser.role === 'SERVICE_STAFF' ? 'orange' : 'purple'
                }>
                  {getRoleDisplayName(currentUser.role)}
                </Tag>
              </p>
            </div>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="nickname"
                label="昵称"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input placeholder="请输入昵称" />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="电话"
              >
                <Input placeholder="请输入电话" />
              </Form.Item>

              {currentUser.role === 'APPLIER' && (
                <Form.Item
                  name="department"
                  label="部门"
                >
                  <Input placeholder="请输入部门" />
                </Form.Item>
              )}

              {currentUser.role === 'SERVICE_STAFF' && (
                <Form.Item
                  name="serviceArea"
                  label="服务区域"
                >
                  <Input placeholder="请输入服务区域" />
                </Form.Item>
              )}

              {currentUser.role === 'MAINTAINER' && (
                <Form.Item
                  name="skill"
                  label="技能"
                >
                  <Input placeholder="请输入技能" />
                </Form.Item>
              )}
            </Form>
          </div>
        )}
      </Drawer>
    </div>
    </PageErrorBoundary>
  );
} 