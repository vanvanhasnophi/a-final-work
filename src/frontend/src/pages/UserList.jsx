import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Card, Button, Space, Drawer, Form, Input, DatePicker, Select, message, Alert, Tag, Pagination, Result, Modal, Tooltip } from 'antd';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { PlusOutlined, EyeOutlined, EditOutlined, ReloadOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { userAPI } from '../api/user';
import { register, deleteUser as authDeleteUser } from '../api/auth';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { getRoleDisplayName } from '../utils/roleMapping';
import { getPermissionDisplayName } from '../utils/permissionMapping';
import { useDebounceSearchV2 } from '../hooks/useDebounceSearchV2';
import { formatDateTime } from '../utils/dateFormat';
import { useAuth } from '../contexts/AuthContext';
import { canCreateUser, canDeleteUser, canViewUsers, UserRole } from '../utils/permissionUtils';
import { getUserDisplayName } from '../utils/userDisplay';
import FixedTop from '../components/FixedTop';

const { Option } = Select;

export default function UserList() {
  const { user, clearAuth } = useAuth();
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
  const [modal, contextHolderModal] = Modal.useModal();
  const roleSelectRef = useRef(null);
  const [selectedRole, setSelectedRole] = useState(undefined);
  const [authError, setAuthError] = useState(null);
  const [createFormRole, setCreateFormRole] = useState(undefined);

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'detail', 'edit', 'create'
  const [createPassword, setCreatePassword] = useState('');
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
        
        // 清除认证错误
        setAuthError(null);
        
        return response.data;
      },
      {
        errorMessage: '获取用户列表失败，请检查网络连接',
        maxRetries: 0, // 不重试，避免反复请求
        retryDelay: 0,
        onError: (error) => {
          // 处理认证错误
          if (error.response?.status === 401) {
            setAuthError('Token已过期，请重新登录');
            messageApi.error('Token已过期，请重新登录');
            // 延迟清理认证状态，给用户时间看到错误信息
            setTimeout(() => {
              clearAuth();
              window.location.href = '/login';
            }, 2000);
          } else if (error.response?.status === 403) {
            setAuthError('权限不足，需要管理员权限');
            messageApi.error('权限不足，需要管理员权限');
          }
        }
      }
    );
    return result;
  }, [executeUsers, searchParams, messageApi, clearAuth]); // 修复依赖

  // 初始化加载
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // 修复依赖

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

  // 打开详情抽屉
  const handleViewDetail = (record) => {
    setDrawerType('detail');
    setCurrentUser(record);
    setDrawerVisible(true);
  };

  // 打开创建用户抽屉
  const handleCreateUser = () => {
    setDrawerType('create');
    setCurrentUser(null);
    form.resetFields();
    setCreateFormRole(undefined);
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

  // 删除用户
  const handleDeleteUser = (record) => {
    modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除用户 "${record.username}" 吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
              onOk: async () => {
          try {
            await authDeleteUser(record.id);
            messageApi.success('用户删除成功');
            fetchUsers(); // 刷新列表
          } catch (error) {
            console.error('删除用户失败:', error);
            messageApi.error('删除用户失败: ' + (error.response?.data?.message || error.message || '未知错误'));
          }
        }
    });
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setDrawerType('');
    setCurrentUser(null);
    form.resetFields();
    setCreateFormRole(undefined);
  };

  // 根据角色获取创建用户时的特有字段
  const getCreateFormRoleSpecificFields = () => {
    if (!createFormRole) return null;

    switch (createFormRole) {
      case 'APPLIER':
        return (
          <Form.Item
            name="department"
            label="部门"
            rules={[{ required: true, message: '请输入部门' }]}
          >
            <Input placeholder="请输入部门" />
          </Form.Item>
        );
      
      case 'APPROVER':
        return (
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
        );
      
      case 'SERVICE':
        return (
          <Form.Item
            name="serviceArea"
            label="负责区域"
            rules={[{ required: true, message: '请输入负责区域' }]}
          >
            <Input placeholder="请输入负责区域" />
          </Form.Item>
        );
      
      case 'MAINTAINER':
        return (
          <Form.Item
            name="skill"
            label="维修范围"
            rules={[{ required: true, message: '请输入维修范围' }]}
          >
            <Input placeholder="请输入维修范围" />
          </Form.Item>
        );
      
      default:
        return null;
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (drawerType === 'create') {
        await executeUsers(
          async () => {
            // 使用auth的register接口创建用户，需要包含密码
            const userData = {
              username: values.username,
              password: values.password, // 添加密码字段
              nickname: values.nickname,
              email: values.email,
              phone: values.phone,
              role: values.role
            };
            const response = await register(userData);
            messageApi.success('用户创建成功');
            handleCloseDrawer();
            fetchUsers(); // 刷新列表
            return response;
          },
          {
            errorMessage: '用户创建失败',
            successMessage: '用户创建成功'
          }
        );
      } else if (drawerType === 'edit') {
        await executeUsers(
          async () => {
            const userData = {
              ...currentUser,
              ...values
            };
            const response = await userAPI.updateUser(currentUser.id, userData);
            messageApi.success('用户信息更新成功');
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

  // 如果用户没有用户查看权限，显示权限不足页面
  if (user && !canViewUsers(user.role)) {
    return (
      <div style={{ padding: '24px' }}>
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面。"
          extra={
            <div>
              <p>当前用户角色: {getRoleDisplayName(user?.role)}</p>
              <p>需要用户查看权限才能访问用户管理功能。</p>
              <Button type="primary" onClick={() => window.history.back()}>
                返回上一页
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  // 如果有认证错误，显示错误页面
  if (authError) {
    return (
      <div style={{ padding: '24px' }}>
        <Result
          status="error"
          title="访问失败"
          subTitle={authError}
          extra={[
            <Button key="back" onClick={() => window.history.back()}>
              返回上一页
            </Button>,
            <Button key="login" type="primary" onClick={() => window.location.href = '/login'}>
              重新登录
            </Button>
          ]}
        />
      </div>
    );
  }

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
                     role === 'SERVICE' ? 'orange' : 'purple';
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
      render: (_, record) => {
        return (
          <Space size="middle">
            <Tooltip title="查看详情">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                size="small"
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            <Tooltip title="编辑用户">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                size="small"
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            {canDeleteUser(user?.role) ? (
              <Tooltip title="删除用户">
                <Button 
                  type="text" 
                  icon={<DeleteOutlined />} 
                  size="small"
                  danger
                  onClick={() => handleDeleteUser(record)}
                />
              </Tooltip>
            ) : (
              <span style={{ color: '#999', fontSize: '12px' }}>
                无删除权限
              </span>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}
      {contextHolderModal}
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
            {canCreateUser(user?.role) && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreateUser}
              >
                创建用户
              </Button>
            )}
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
                <Option value="SERVICE">服务人员</Option>
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
                  dataSource={users}
                  rowKey="id"
                  loading={usersLoading}
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
          drawerType === 'edit' ? '编辑用户' :
          drawerType === 'create' ? '创建用户' : ''
        }
        width={600}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        footer={
          drawerType === 'edit' || drawerType === 'create' ? (
            <div style={{ textAlign: 'right' }}>
              <Button onClick={handleCloseDrawer} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" onClick={() => form.submit()}>
                {drawerType === 'create' ? '创建' : '保存'}
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
                  <strong>显示名称：</strong>
                  <span>{getUserDisplayName(currentUser)}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>用户名：</strong>
                  <span>{currentUser.username}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>昵称：</strong>
                  <span>{currentUser.nickname || '-'}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>角色：</strong>
                  <Tag color={
                    currentUser.role === 'ADMIN' ? 'red' : 
                    currentUser.role === 'APPROVER' ? 'blue' : 
                    currentUser.role === 'APPLIER' ? 'green' : 
                    currentUser.role === 'SERVICE' ? 'orange' : 'purple'
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
                    <strong>负责区域：</strong>
                    <span>{currentUser.serviceArea}</span>
                  </div>
                )}
                {currentUser.permission && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>审批权限：</strong>
                    <span>{getPermissionDisplayName(currentUser.permission)}</span>
                  </div>
                )}
                {currentUser.skill && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>维修范围：</strong>
                    <span>{currentUser.skill}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {drawerType === 'create' && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '至少 8 个字符' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const parts = [
                      value.length >= 8,
                      /[A-Z]/.test(value),
                      /[a-z]/.test(value),
                      /[0-9]/.test(value),
                      /[!@#$%^&*()_+\-={}[\]|:;"'<>.,?/]/.test(value)
                    ].filter(Boolean).length;
                    if (parts >= 3 && value.length >= 8) return Promise.resolve();
                    return Promise.reject(new Error('除长度外至少满足任意2类: 大写/小写/数字/特殊'));
                  }
                }
              ]}
            >
              <Input.Password placeholder="请输入密码" onChange={(e)=> setCreatePassword(e.target.value)} />
            </Form.Item>
            <PasswordStrengthMeter password={createPassword} />

            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select 
                placeholder="请选择角色"
                onChange={(value) => {
                  setCreateFormRole(value);
                  // 清空角色特有字段的值
                  form.setFieldsValue({
                    department: undefined,
                    permission: undefined,
                    serviceArea: undefined,
                    skill: undefined
                  });
                }}
              >
                <Option value="APPLIER">申请者</Option>
                <Option value="APPROVER">审批者</Option>
                <Option value="SERVICE">服务人员</Option>
                <Option value="MAINTAINER">维护人员</Option>
                <Option value="ADMIN">管理员</Option>
              </Select>
            </Form.Item>

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

            {/* 根据选择的角色显示特有字段 */}
            {getCreateFormRoleSpecificFields()}
          </Form>
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
              <p style={{ color: 'var(--text-color)' }}><strong>显示名称：</strong>{getUserDisplayName(currentUser)}</p>
              <p style={{ color: 'var(--text-color)' }}><strong>用户名：</strong>{currentUser.username}</p>
              <p style={{ color: 'var(--text-color)' }}><strong>角色：</strong>
                <Tag color={
                  currentUser.role === 'ADMIN' ? 'red' : 
                  currentUser.role === 'APPROVER' ? 'blue' : 
                  currentUser.role === 'APPLIER' ? 'green' : 
                  currentUser.role === 'SERVICE' ? 'orange' : 'purple'
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

              {/* 根据用户角色显示特有字段 */}
              {currentUser.role === 'APPLIER' && (
                <Form.Item
                  name="department"
                  label="部门"
                >
                  <Input placeholder="请输入部门" />
                </Form.Item>
              )}

              {currentUser.role === 'APPROVER' && (
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
              )}

              {currentUser.role === 'SERVICE' && (
                <Form.Item
                  name="serviceArea"
                  label="负责区域"
                >
                  <Input placeholder="请输入负责区域" />
                </Form.Item>
              )}

              {currentUser.role === 'MAINTAINER' && (
                <Form.Item
                  name="skill"
                  label="维修范围"
                >
                  <Input placeholder="请输入维修范围" />
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