import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Space, Drawer, Form, Input, Select, message, Tag, Result, Modal, Tooltip, App } from 'antd';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { PlusOutlined, EyeOutlined, EditOutlined, ReloadOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { userAPI } from '../api/user';
import { register, deleteUser as authDeleteUser, /*verifyPassword,*/ dangerousOperationVerify } from '../api/auth';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { getRoleDisplayName } from '../utils/roleMapping';
import { getPermissionDisplayName } from '../utils/permissionMapping';
import { useDebounceSearchV2 } from '../hooks/useDebounceSearchV2';
import { formatDateTime } from '../utils/dateFormat';
import { useAuth } from '../contexts/AuthContext';
import { canCreateUser, canDeleteUser, canViewUsers/*, UserRole*/ } from '../utils/permissionUtils';
import ResponsiveButton from '../components/ResponsiveButton';
import { getUserDisplayName } from '../utils/userDisplay';
import { useI18n } from '../contexts/I18nContext';
import ManagementPageContainer from '../components/ManagementPageContainer';

const { Option } = Select;

function UserListContent() {
  const { t } = useI18n();
  const { user, clearAuth, logout } = useAuth();
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
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // 二次确认弹窗状态
  const [secondConfirmVisible, setSecondConfirmVisible] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [confirmationError, setConfirmationError] = useState('');

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
        errorMessage: t('userList.errors.dataFetchTitle', '获取用户列表失败，请检查网络连接'),
        maxRetries: 0, // 不重试，避免反复请求
        retryDelay: 0,
        onError: (error) => {
          // 处理认证错误
          if (error.response?.status === 401) {
            setAuthError(t('userList.auth.tokenExpired', 'Token已过期，请重新登录'));
            messageApi.error(t('userList.auth.tokenExpired', 'Token已过期，请重新登录'));
            // 延迟清理认证状态，给用户时间看到错误信息
            setTimeout(() => {
              clearAuth();
              window.location.href = '/login';
            }, 2000);
          } else if (error.response?.status === 403) {
            setAuthError(t('userList.auth.forbidden', '权限不足，需要管理员权限'));
            messageApi.error(t('userList.auth.forbidden', '权限不足，需要管理员权限'));
          }
        }
      }
    );
    return result;
  }, [executeUsers, searchParams, messageApi, clearAuth, t]);

  // 初始化加载
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    // 检查是否是删除自己
    const isDeletingSelf = record.id === user?.id;

    // 二次确认逻辑
    const showSecondConfirm = () => {
      setDeleteTargetUser(record);
      setConfirmationInput('');
      setConfirmationError('');
      setSecondConfirmVisible(true);
    };

    // 主确认弹框
    const showMainConfirm = () => {
      modal.confirm({
        title: t('userList.confirmDelete.title', '确认删除'),
        icon: <ExclamationCircleOutlined />,
        content: t('userList.confirmDelete.content', '确定要删除用户 "{username}" 吗？此操作不可恢复。').replace('{username}', record.username),
        okText: t('userList.confirmDelete.nextStep', '下一步'),
        cancelText: t('common.cancel', '取消'),
        okType: 'danger',
        onOk: showSecondConfirm
      });
    };

    // 如果是删除自己，先显示额外警告
    if (isDeletingSelf) {
      modal.confirm({
        title: t('userList.confirmDeleteSelf.title', '警告：删除自己的账户'),
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>{t('userList.confirmDeleteSelf.warning', '您正在尝试删除自己的管理员账户！')}</p>
            <p>{t('userList.confirmDeleteSelf.consequence', '删除后您将立即退出系统，无法撤销此操作。')}</p>
            <p><strong>{t('userList.confirmDeleteSelf.confirm', '确定要继续吗？')}</strong></p>
          </div>
        ),
        okText: t('userList.confirmDeleteSelf.continueText', '继续删除'),
        cancelText: t('common.cancel', '取消'),
        okType: 'danger',
        onOk: showSecondConfirm  // 直接跳转到二次确认，跳过主确认
      });
    } else {
      showMainConfirm();
    }
  };

  // 处理二次确认
  const handleSecondConfirm = async () => {
    if (!deleteTargetUser) return;

    const isDeletingSelf = deleteTargetUser.id === user?.id;
    let verificationToken = null;

    try {
      // 验证输入
      if (isDeletingSelf) {
        // 删除自己需要输入密码
        if (!confirmationInput.trim()) {
          setConfirmationError(t('userList.secondConfirm.passwordRequired', '请输入密码'));
          return;
        }

        // 调用危险操作验证API获取临时令牌
        const response = await dangerousOperationVerify(confirmationInput.trim(), 'DELETE_USER');
        if (response.data?.success && response.data?.verificationToken) {
          verificationToken = response.data.verificationToken;
        } else {
          setConfirmationError(t('userList.secondConfirm.passwordIncorrect', '密码不正确'));
          return;
        }
      } else {
        // 删除其他用户需要输入用户名，然后需要管理员密码验证
        if (confirmationInput.trim() !== deleteTargetUser.username) {
          setConfirmationError(t('userList.secondConfirm.usernameIncorrect', '用户名不正确'));
          return;
        }

        // 用户名验证通过，现在需要弹出管理员密码输入框
        // 为了简化，这里我们提示用户在同一个输入框输入管理员密码
        const adminPassword = await new Promise((resolve, reject) => {
          Modal.confirm({
            title: t('userList.adminVerify.title', '管理员验证'),
            content: (
              <div>
                <p>{t('userList.adminVerify.content', '删除用户需要管理员权限验证，请输入您的管理员密码：')}</p>
                <Input.Password
                  placeholder={t('userList.adminVerify.placeholder', '请输入管理员密码')}
                  onPressEnter={(e) => {
                    if (e.target.value.trim()) {
                      resolve(e.target.value.trim());
                      Modal.destroyAll();
                    }
                  }}
                  ref={(input) => {
                    if (input) {
                      setTimeout(() => input.focus(), 100);
                    }
                  }}
                />
              </div>
            ),
            okText: t('userList.adminVerify.okText', '确认'),
            cancelText: t('common.cancel', '取消'),
            onOk: () => {
              const input = document.querySelector('.ant-modal input[type="password"]');
              const password = input ? input.value : '';
              if (password.trim()) {
                resolve(password.trim());
              } else {
                message.error(t('userList.adminVerify.required', '管理员密码不能为空'));
                return Promise.reject();
              }
            },
            onCancel: () => {
              reject(new Error('用户取消'));
            },
          });
        });

        // 使用管理员密码进行验证
        const response = await dangerousOperationVerify(adminPassword, 'DELETE_USER');
        if (response.data?.success && response.data?.verificationToken) {
          verificationToken = response.data.verificationToken;
        } else {
          setConfirmationError('管理员密码验证失败');
          return;
        }
      }

      if (verificationToken) {
        await authDeleteUser(deleteTargetUser.id, verificationToken);
        messageApi.success(t('userList.messages.deleteSuccess', '用户删除成功'));

        // 如果删除的是自己，自动退出登录
        if (isDeletingSelf) {
          messageApi.info(t('userList.messages.selfDeleteLogout', '您已删除自己的账户，即将退出登录'));
          setTimeout(() => {
            logout();
          }, 2000);
        } else {
          fetchUsers(); // 刷新列表
        }

        // 关闭弹窗
        setSecondConfirmVisible(false);
        setDeleteTargetUser(null);
        setConfirmationInput('');
        setConfirmationError('');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      if (error.message === '用户取消') {
        // 用户取消了管理员密码输入
        return;
      }
      if (error.response?.data?.message?.includes('验证令牌') || error.response?.data?.message?.includes('验证失败')) {
        setConfirmationError(t('userList.secondConfirm.passwordIncorrect', '密码不正确'));
      } else {
        messageApi.error(
          t('userList.messages.deleteFailPrefix', '删除用户失败: ') +
          (error.response?.data?.message || error.message || t('user.common.notSet', '未知错误'))
        );
      }
    }
  };

  // 取消二次确认
  const handleSecondConfirmCancel = () => {
    setSecondConfirmVisible(false);
    setDeleteTargetUser(null);
    setConfirmationInput('');
    setConfirmationError('');
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
            label={t('userList.form.department', '部门')}
            rules={[{ required: true, message: t('userList.form.enterDepartment', '请输入部门') }]}
          >
            <Input placeholder={t('userList.form.enterDepartment', '请输入部门')} />
          </Form.Item>
        );

      case 'APPROVER':
        return (
          <Form.Item
            name="permission"
            label={t('userList.form.permission', '审批权限')}
          >
            <Select placeholder={t('userList.form.selectPermission', '请选择审批权限')}>
              <Option value="READ_ONLY">{t('user.permission.READ_ONLY', '只读')}</Option>
              <Option value="RESTRICTED">{t('user.permission.RESTRICTED', '受限')}</Option>
              <Option value="NORMAL">{t('user.permission.NORMAL', '正常')}</Option>
              <Option value="EXTENDED">{t('user.permission.EXTENDED', '扩展')}</Option>
            </Select>
          </Form.Item>
        );

      case 'SERVICE':
        return (
          <Form.Item
            name="serviceArea"
            label={t('userList.form.serviceArea', '负责区域')}
            rules={[{ required: true, message: t('userList.form.enterServiceArea', '请输入负责区域') }]}
          >
            <Input placeholder={t('userList.form.enterServiceArea', '请输入负责区域')} />
          </Form.Item>
        );

      case 'MAINTAINER':
        return (
          <Form.Item
            name="skill"
            label={t('userList.form.skill', '维修范围')}
            rules={[{ required: true, message: t('userList.form.enterSkill', '请输入维修范围') }]}
          >
            <Input placeholder={t('userList.form.enterSkill', '请输入维修范围')} />
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
              password: values.password,
              nickname: values.nickname,
              email: values.email,
              phone: values.phone,
              role: values.role,
              department: values.department,
              permission: values.permission,
              serviceArea: values.serviceArea,
              skill: values.skill,
            };
            const response = await register(userData);
            messageApi.success(t('userList.messages.createSuccess', '用户创建成功'));
            handleCloseDrawer();
            fetchUsers(); // 刷新列表
            return response;
          },
          {
            errorMessage: t('userList.messages.createFail', '用户创建失败'),
            successMessage: t('userList.messages.createSuccess', '用户创建成功')
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
            messageApi.success(t('userList.messages.updateSuccess', '用户信息更新成功'));
            handleCloseDrawer();
            fetchUsers(); // 刷新列表
            return response;
          },
          {
            errorMessage: t('userList.messages.updateFail', '用户信息更新失败'),
            successMessage: t('userList.messages.updateSuccess', '用户信息更新成功')
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
          subTitle={t('userList.auth.result403Subtitle', '抱歉，您没有权限访问此页面。')}
          extra={
            <div>
              <p>{t('userList.auth.result403RolePrefix', '当前用户角色: ')}{getRoleDisplayName(user?.role)}</p>
              <p>{t('userList.auth.result403NeedRole', '需要用户查看权限才能访问用户管理功能。')}</p>
              <Button type="primary" onClick={() => window.history.back()}>
                {t('applicationManagement.actions.back', '返回上一页')}
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
          title={t('userList.auth.resultErrorTitle', '访问失败')}
          subTitle={authError}
          extra={[
            <Button key="back" onClick={() => window.history.back()}>
              {t('applicationManagement.actions.back', '返回上一页')}
            </Button>,
            <Button key="login" type="primary" onClick={() => window.location.href = '/login'}>
              {t('applicationManagement.actions.login', '重新登录')}
            </Button>
          ]}
        />
      </div>
    );
  }

  const columns = [
    {
      title: t('userList.columns.username', '用户名'),
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: t('userList.columns.nickname', '昵称'),
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: t('userList.columns.role', '角色'),
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
      title: t('userList.columns.email', '邮箱'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('userList.columns.phone', '电话'),
      dataIndex: 'phone',
      key: 'phone',
      onCell: () => ({ 'data-field': 'phone' }),
      render: (phone) => (
        <span className="num-mono">{phone || '-'}</span>
      ),
    },
    {
      title: t('userList.columns.createTime', '注册时间'),
      dataIndex: 'createTime',
      key: 'createTime',
      onCell: () => ({ 'data-field': 'createTime' }),
      render: (createTime) => (
        <span className="num-mono">{formatDateTime(createTime)}</span>
      ),
    },
    {
      title: t('userList.columns.lastLoginTime', '最后登录'),
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      onCell: () => ({ 'data-field': 'lastLoginTime' }),
      render: (lastLoginTime) => (
        lastLoginTime ? <span className="num-mono">{formatDateTime(lastLoginTime)}</span> : '-'
      ),
    },
    {
      title: t('userList.columns.actions', '操作'),
      key: 'action',
      render: (_, record) => {
        return (
          <Space size="middle">
            <Tooltip title={t('userList.tooltips.viewDetail', '查看详情')}>
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            <Tooltip title={t('userList.tooltips.editUser', '编辑用户')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            {canDeleteUser(user?.role) ? (
              <Tooltip title={t('userList.tooltips.deleteUser', '删除用户')}>
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
                {t('userList.noDeletePermission', '无删除权限')}
              </span>
            )}
          </Space>
        );
      },
    },
  ];

  const filterControls = [
    <div style={{ minWidth: '200px' }}>
      <Input
        placeholder={t('userList.filters.searchUsername', '搜索用户名')}
        allowClear
        style={{ width: '100%' }}
        value={usernameSearch.searchValue}
        onChange={(e) => usernameSearch.updateSearchValue(e.target.value)}
        onPressEnter={() => usernameSearch.searchImmediately(usernameSearch.searchValue)}
      />
    </div>
    ,
    <div style={{ minWidth: '150px' }}>
      <Input
        placeholder={t('userList.filters.searchNickname', '搜索昵称')}
        allowClear
        style={{ width: '100%' }}
        value={nicknameSearch.searchValue}
        onChange={(e) => nicknameSearch.updateSearchValue(e.target.value)}
        onPressEnter={() => nicknameSearch.searchImmediately(nicknameSearch.searchValue)}
      />
    </div>
    ,
    <div style={{ minWidth: '120px' }}>
      <Select
        ref={roleSelectRef}
        placeholder={t('userList.allRoles', '全部角色')}
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
        <Option value="ADMIN">{t('user.role.ADMIN', '管理员')}</Option>
        <Option value="APPLIER">{t('user.role.APPLIER', '申请人')}</Option>
        <Option value="APPROVER">{t('user.role.APPROVER', '审批人')}</Option>
        <Option value="SERVICE">{t('user.role.SERVICE', '服务人员')}</Option>
        <Option value="MAINTAINER">{t('user.role.MAINTAINER', '维修人员')}</Option>
      </Select>
    </div >
    ,
    < div style={{ display: 'flex', gap: '8px' }}>
      <Button
        onClick={() => {
          // 清空筛选控件内容
          usernameSearch.updateSearchValue('');
          nicknameSearch.updateSearchValue('');
          // 清空角色选择器
          setSelectedRole(undefined);
        }}
      >
        {t('common.clearFilters', '清空筛选')}
      </Button>
    </div >,
  ];

  const actions = [
    <ResponsiveButton
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
      {t('common.refresh', '刷新')}
    </ResponsiveButton>
    ,
    canCreateUser(user?.role) && (
      <ResponsiveButton
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleCreateUser}
      >
        {t('userList.createUser', '创建用户')}
      </ResponsiveButton>)
    ,
  ]

  // 3. tableProps
  const tableProps = {
    columns,
    dataSource: users,
    rowKey: 'id',
    loading: usersLoading,
    onChange: handleTableChange,
    sticky: { offsetHeader: 0 },
  }


  // 4. pageProps
  const pageProps = {
    ...pagination,
    showSizeChanger: !isFilterCollapsed,
    showQuickJumper: !isFilterCollapsed,
    showTotal: (total, range) => {
      return t('userList.paginationTotal', '第 {from}-{to} 条/共 {total} 条').replace('{from}', range[0]).replace('{to}', range[1]).replace('{total}', total)
    },
    pageSizeOptions: ['10', '20', '50', '100'],
    size: 'default',
    onChange: (page, pageSize) => {
      const newParams = {
        pageNum: page,
        pageSize: pageSize,
      };
      setSearchParams(prev => ({ ...prev, ...newParams }));
      fetchUsers(newParams);
    },
    onShowSizeChange: (current, size) => {
      const newParams = {
        pageNum: 1,
        pageSize: size,
      };
      setSearchParams(prev => ({ ...prev, ...newParams }));
      fetchUsers(newParams);
    }
  }

  // 5. 错误提示
  const error = usersError && {
    title: t('userList.errors.dataFetchFail', '获取用户列表失败'),
    description: String(usersError.message),
  };


  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}
      <ManagementPageContainer
        title={t('userList.title')}
        actions={actions}
        filterControls={filterControls}
        filterCollapsed={isFilterCollapsed}
        filterCollapseThreshold= {940}
        onFilterCollapseChange={setIsFilterCollapsed}
        tableProps={tableProps}
        pageProps={pageProps}
        error={error}
      />
      {/* Drawer/Modal等业务弹窗保留 */}
      <Drawer
        title={
          drawerType === 'detail' ? t('userList.drawer.detail', '用户详情') :
            drawerType === 'edit' ? t('userList.drawer.edit', '编辑用户') :
              drawerType === 'create' ? t('userList.drawer.create', '创建用户') : ''
        }
        width={600}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        footer={
          drawerType === 'edit' || drawerType === 'create' ? (
            <div style={{ textAlign: 'right' }}>
              <Button onClick={handleCloseDrawer} style={{ marginRight: 8 }}>
                {t('common.cancel', '取消')}
              </Button>
              <Button type="primary" onClick={() => form.submit()}>
                {drawerType === 'create' ? t('common.create', '创建') : t('common.save', '保存')}
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
                  <strong>{t('userList.labels.displayName', '显示名称')}：</strong>
                  <span>{getUserDisplayName(currentUser)}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('userList.labels.username', '用户名')}：</strong>
                  <span>{currentUser.username}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('userList.labels.nickname', '昵称')}：</strong>
                  <span>{currentUser.nickname || '-'}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('userList.labels.role', '角色')}：</strong>
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
                  <strong>{t('userList.labels.email', '邮箱')}：</strong>
                  <span>{currentUser.email || '-'}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('userList.labels.phone', '电话')}：</strong>
                  <span className="num-mono" data-field="phone">{currentUser.phone || '-'}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('userList.labels.createTime', '注册时间')}：</strong>
                  <span className="num-mono" data-field="createTime">{formatDateTime(currentUser.createTime)}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('userList.labels.lastLoginTime', '最后登录')}：</strong>
                  <span className="num-mono" data-field="lastLoginTime">{currentUser.lastLoginTime ? formatDateTime(currentUser.lastLoginTime) : '-'}</span>
                </div>
                {currentUser.department && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>{t('userList.labels.department', '部门')}：</strong>
                    <span>{currentUser.department}</span>
                  </div>
                )}
                {currentUser.serviceArea && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>{t('userList.labels.serviceArea', '负责区域')}：</strong>
                    <span>{currentUser.serviceArea}</span>
                  </div>
                )}
                {currentUser.permission && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>{t('userList.labels.permission', '审批权限')}：</strong>
                    <span>{getPermissionDisplayName(currentUser.permission)}</span>
                  </div>
                )}
                {currentUser.skill && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>{t('userList.labels.skill', '维修范围')}：</strong>
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
              label={t('userList.form.username', '用户名')}
              rules={[{ required: true, message: t('userList.form.enterUsername', '请输入用户名') }]}
            >
              <Input placeholder={t('userList.form.enterUsername', '请输入用户名')} />
            </Form.Item>

            <Form.Item
              name="password"
              label={t('userList.form.password', '密码')}
              rules={[
                { required: true, message: t('userList.form.enterPassword', '请输入密码') },
                { min: 8, message: t('user.common.passwordMin8', '至少 8 个字符') },
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
                    return Promise.reject(new Error(t('user.common.passwordRule', '除长度外至少满足任意2类: 大写/小写/数字/特殊')));
                  }
                }
              ]}
            >
              <Input.Password placeholder={t('userList.form.enterPassword', '请输入密码')} onChange={(e) => setCreatePassword(e.target.value)} />
            </Form.Item>
            <PasswordStrengthMeter password={createPassword} />

            <Form.Item
              name="role"
              label={t('userList.form.role', '角色')}
              rules={[{ required: true, message: t('userList.form.selectRole', '请选择角色') }]}
            >
              <Select
                placeholder={t('userList.form.selectRole', '请选择角色')}
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
                <Option value="APPLIER">{t('user.role.APPLIER', '申请人')}</Option>
                <Option value="APPROVER">{t('user.role.APPROVER', '审批人')}</Option>
                <Option value="SERVICE">{t('user.role.SERVICE', '服务人员')}</Option>
                <Option value="MAINTAINER">{t('user.role.MAINTAINER', '维护人员')}</Option>
                <Option value="ADMIN">{t('user.role.ADMIN', '管理员')}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="nickname"
              label={t('userList.form.nickname', '昵称')}
              rules={[{ required: true, message: t('userList.form.enterNickname', '请输入昵称') }]}
            >
              <Input placeholder={t('userList.form.enterNickname', '请输入昵称')} />
            </Form.Item>

            <Form.Item
              name="email"
              label={t('userList.form.email', '邮箱')}
              rules={[
                { type: 'email', message: t('user.common.enterValidEmail', '请输入有效的邮箱地址') }
              ]}
            >
              <Input placeholder={t('userList.form.enterEmail', '请输入邮箱')} />
            </Form.Item>

            <Form.Item
              name="phone"
              label={t('userList.form.phone', '电话')}
            >
              <Input placeholder={t('userList.form.enterPhone', '请输入电话')} />
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
              <p style={{ color: 'var(--text-color)' }}><strong>{t('userList.labels.displayName', '显示名称')}：</strong>{getUserDisplayName(currentUser)}</p>
              <p style={{ color: 'var(--text-color)' }}><strong>{t('userList.labels.username', '用户名')}：</strong>{currentUser.username}</p>
              <p style={{ color: 'var(--text-color)' }}><strong>{t('userList.labels.role', '角色')}：</strong>
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
                label={t('userList.form.nickname', '昵称')}
                rules={[{ required: true, message: t('userList.form.enterNickname', '请输入昵称') }]}
              >
                <Input placeholder={t('userList.form.enterNickname', '请输入昵称')} />
              </Form.Item>

              <Form.Item
                name="email"
                label={t('userList.form.email', '邮箱')}
                rules={[
                  { type: 'email', message: t('user.common.enterValidEmail', '请输入有效的邮箱地址') }
                ]}
              >
                <Input placeholder={t('userList.form.enterEmail', '请输入邮箱')} />
              </Form.Item>

              <Form.Item
                name="phone"
                label={t('userList.form.phone', '电话')}
              >
                <Input placeholder={t('userList.form.enterPhone', '请输入电话')} />
              </Form.Item>

              {/* 根据用户角色显示特有字段 */}
              {currentUser.role === 'APPLIER' && (
                <Form.Item
                  name="department"
                  label={t('userList.form.department', '部门')}
                >
                  <Input placeholder={t('userList.form.enterDepartment', '请输入部门')} />
                </Form.Item>
              )}

              {currentUser.role === 'APPROVER' && (
                <Form.Item
                  name="permission"
                  label={t('userList.form.permission', '审批权限')}
                >
                  <Select placeholder={t('userList.form.selectPermission', '请选择审批权限')}>
                    <Option value="READ_ONLY">{t('user.permission.READ_ONLY', '只读')}</Option>
                    <Option value="RESTRICTED">{t('user.permission.RESTRICTED', '受限')}</Option>
                    <Option value="NORMAL">{t('user.permission.NORMAL', '正常')}</Option>
                    <Option value="EXTENDED">{t('user.permission.EXTENDED', '扩展')}</Option>
                  </Select>
                </Form.Item>
              )}

              {currentUser.role === 'SERVICE' && (
                <Form.Item
                  name="serviceArea"
                  label={t('userList.form.serviceArea', '负责区域')}
                >
                  <Input placeholder={t('userList.form.enterServiceArea', '请输入负责区域')} />
                </Form.Item>
              )}

              {currentUser.role === 'MAINTAINER' && (
                <Form.Item
                  name="skill"
                  label={t('userList.form.skill', '维修范围')}
                >
                  <Input placeholder={t('userList.form.enterSkill', '请输入维修范围')} />
                </Form.Item>
              )}
            </Form>
          </div>
        )}
      </Drawer>

      {/* 二次确认Modal */}
      <Modal
        title={deleteTargetUser?.id === user?.id ?
          t('userList.secondConfirm.passwordTitle', '输入密码确认') :
          t('userList.secondConfirm.usernameTitle', '输入用户名确认')
        }
        open={secondConfirmVisible}
        onOk={handleSecondConfirm}
        onCancel={handleSecondConfirmCancel}
        okText={t('userList.secondConfirm.confirmDelete', '确认删除')}
        cancelText={t('common.cancel', '取消')}
        okType="danger"
        destroyOnClose
        confirmLoading={false}
      >
        <div style={{ marginBottom: 16 }}>
          <p>
            {deleteTargetUser?.id === user?.id ?
              t('userList.secondConfirm.passwordPrompt', '为了确认删除自己的账户，请输入您的密码：') :
              t('userList.secondConfirm.usernamePrompt', '为了确认删除用户 "{username}"，请输入该用户的用户名：').replace('{username}', deleteTargetUser?.username || '')
            }
          </p>
        </div>
        {deleteTargetUser?.id === user?.id ? (
          <Input.Password
            placeholder={t('userList.secondConfirm.enterPassword', '请输入密码')}
            value={confirmationInput}
            onChange={(e) => {
              setConfirmationInput(e.target.value);
              setConfirmationError('');
            }}
            status={confirmationError ? 'error' : ''}
            onPressEnter={e => {
              e.preventDefault();
              handleSecondConfirm();
            }}
            autoFocus
          />
        ) : (
          <Input
            placeholder={t('userList.secondConfirm.enterUsername', '请输入用户名')}
            value={confirmationInput}
            onChange={(e) => {
              setConfirmationInput(e.target.value);
              setConfirmationError('');
            }}
            status={confirmationError ? 'error' : ''}
            onPressEnter={e => {
              e.preventDefault();
              handleSecondConfirm();
            }}
            autoFocus
          />
        )}
        {confirmationError && (
          <div style={{ color: '#ff4d4f', marginTop: 8, fontSize: '14px' }}>
            {confirmationError}
          </div>
        )}
      </Modal>
    </PageErrorBoundary>
  );
}


export default function UserList() {
  return (
    <App>
      <UserListContent />
    </App>
  );
}

