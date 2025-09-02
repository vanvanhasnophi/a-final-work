import '../../styles/modal-btn-row.css';
import React, { useState, useEffect, useCallback, useRef, useContext, useMemo } from 'react';
import { theme, List, Button, Drawer, Form, Input, Divider, Select, message, Tag, Result, Modal, Tooltip, Skeleton } from 'antd';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { PlusOutlined, FilterOutlined, FilterFilled, EyeOutlined, EditOutlined, ReloadOutlined, DeleteOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { userAPI } from '../../api/user';
import { register, deleteUser as authDeleteUser,/* verifyPassword ,*/ dangerousOperationVerify } from '../../api/auth';
import { useApiWithRetry } from '../../hooks/useApiWithRetry';
import { usePageRefresh } from '../../hooks/usePageRefresh';
import PageErrorBoundary from '../../components/PageErrorBoundary';
import { getRoleDisplayName } from '../../utils/roleMapping';
import { getPermissionDisplayName } from '../../utils/permissionMapping';
import { formatDateTime } from '../../utils/dateFormat';
import { useAuth } from '../../contexts/AuthContext';
import { canCreateUser, canDeleteUser, canViewUsers /*, UserRole*/ } from '../../utils/permissionUtils';
import ResponsiveButton from '../../components/ResponsiveButton';
import { getUserDisplayName } from '../../utils/userDisplay';
import { useI18n } from '../../contexts/I18nContext';
import { BlurContext } from '../../App';
import ManagementPageContainerM from '../../components/ManagementPageContainerM';


const { Option } = Select;

export default function UserList(props) {

  const { t } = useI18n();
  const { user, clearAuth, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchParams, setSearchParams] = useState({
    pageNum: 1,
    pageSize: 20,
  });
  const [total, setTotal] = useState(0); // 总数
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();
  const [selectedRole, setSelectedRole] = useState(undefined);
  const currentRoleRef = useRef(undefined); // 用于存储最新的角色值
  const [authError, setAuthError] = useState(null);
  const [createFormRole, setCreateFormRole] = useState(undefined);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  // 筛选状态管理
  const [isFiltering, setIsFiltering] = useState(false); // 是否处于筛选状态
  const [inputResetKey, setInputResetKey] = useState(0); // 输入框重置键，用于强制重置输入框

  // 添加 ref 来直接访问输入框的值
  const nameInputRef = useRef(null); // 合并后的搜索框

  // 缓存样式对象避免重渲染
  const inputStyleName = useMemo(() => ({ minWidth: '200px' }), []); // 合并后的搜索框样式
  const selectStyleRole = useMemo(() => ({ minWidth: '120px' }), []);
  const actionsStyle = useMemo(() => ({ display: 'flex', gap: '8px' }), []);
  const inputStyle = useMemo(() => ({ width: '100%' }), []);

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
        onOk: showSecondConfirm,
        className: 'modal-btn-row'
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
        onOk: showSecondConfirm, // 直接跳转到二次确认，跳过主确认
        className: 'modal-btn-row'
      });
    } else {
      showMainConfirm();
    }
  };

  // 获取用户列表
  const fetchUsers = useCallback(async (params = {}, append = false) => {
    const result = await executeUsers(
      async () => {
        const currentSearchParams = searchParams;
        const requestParams = {
          ...currentSearchParams,
          ...params,
        };
        const response = await userAPI.getUserList(requestParams);
        const responseData = response.data || {};
        const { records, total: totalCount } = responseData;

        // 确保 records 是数组，total 是数字
        const finalRecords = Array.isArray(records) ? records : [];
        const finalTotal = (typeof totalCount === 'number' && totalCount >= 0) ? totalCount : 0;

        if (append) {
          setUsers(prev => [...prev, ...finalRecords]);
        } else {
          setUsers(finalRecords);
        }
        setTotal(finalTotal);
        setFloatKey(k => k + 1); // 强制更新悬浮组件显示最新总数
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

          // 错误时也要更新 total 为 0，确保显示正确
          if (!append) {
            setUsers([]);
            setTotal(0);
          }
        }
      }
    );
    return result;
  }, [executeUsers, searchParams, messageApi, clearAuth]);

  // 初始化加载
  useEffect(() => {
    fetchUsers({}, false);
  }, [fetchUsers]);

  // 检测初始筛选参数并设置UI状态
  useEffect(() => {
    const hasInitialFilters = searchParams.name || searchParams.role;
    if (hasInitialFilters) {
      setIsFiltering(true);
      setIsFilterCollapsed(false); // 如果有筛选参数，自动展开筛选器
      // 同步更新 ref 值和角色状态
      if (searchParams.role) {
        setSelectedRole(searchParams.role);
        currentRoleRef.current = searchParams.role;
      }
    }
  }, []); // 只在组件挂载时执行一次
  const [floatKey, setFloatKey] = useState(0);
  const [selectKey, setSelectKey] = useState(0);
  const toggleFilter = () => {
    setIsFilterCollapsed(v => !v);
    setFloatKey(k => k + 1); // 每次切换都让悬浮卡片强制刷新
    setSelectKey(k => k + 1); // 每次切换都让选择框强制刷新
  };

  // 手动搜索函数
  const handleSearch = useCallback(() => {
    // 从 ref 直接获取搜索框的当前值，并进行安全性验证
    const nameValue = (nameInputRef.current?.input?.value || '').substring(0, 100); // 限制长度

    // 基本的输入清理，防止潜在的安全问题
    const cleanName = nameValue.replace(/[<>\"'&]/g, '').trim();

    // 使用 ref 中的最新值，确保获取到最新的选择
    const currentRoleValue = currentRoleRef.current;
    setSelectedRole(currentRoleValue);

    const newParams = {
      name: cleanName || undefined, // 统一的搜索参数，后端会同时在用户名和昵称中搜索
      role: currentRoleValue || undefined,
      pageNum: 1
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    setUsers([]);
    setTotal(0);
    fetchUsers(newParams, false);

    // 更新筛选状态
    const hasFilters = cleanName || currentRoleValue;
    setIsFiltering(!!hasFilters);

    // 如果有筛选条件，保持筛选器展开状态以便用户查看/修改条件
    if (hasFilters && isFilterCollapsed) {
      setIsFilterCollapsed(false);
    }

    setFloatKey(k => k + 1); // 确保筛选按钮颜色立即更新
  }, [selectedRole, fetchUsers, isFilterCollapsed]);

  // 清空筛选
  const handleClearFilters = useCallback(() => {
    // 重置状态变量 - 使用两步重置确保Select组件能感知到变化
    setSelectedRole(null); // 先设为null
    currentRoleRef.current = null; // 同时清空 ref 值
    setIsFiltering(false);
    setFloatKey(k => k + 1); // 强制重新渲染所有组件
    setInputResetKey(k => k + 1); // 强制重置输入框
    setSelectKey(k => k + 1); // 强制重置Select组件

    // 在下一个渲染周期再设为undefined
    setTimeout(() => {
      setSelectedRole(undefined);
      currentRoleRef.current = undefined;
    }, 0);

    const newParams = {
      name: undefined,
      role: undefined,
      pageNum: 1
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    setUsers([]);
    setTotal(0);

    fetchUsers(newParams, false);
  }, [fetchUsers]);

  // 恢复输入框的值从 searchParams（筛选器展开时保持之前的筛选状态）
  // 但在清空筛选时不执行恢复操作
  useEffect(() => {
    if (nameInputRef.current?.input && searchParams.name && !isFilterCollapsed) {
      nameInputRef.current.input.value = searchParams.name;
    }
  }, [searchParams.name, isFilterCollapsed]);

  // 处理回车搜索
  const handleNameKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  const handleRoleChange = useCallback((value) => {
    console.log('Role changed:', value);
    setSelectedRole(value);
    currentRoleRef.current = value;
    setFloatKey(k => k + 1); // 强制重新渲染Select组件
    setSelectKey(k => k + 1); // 强制重新渲染Select组件
    handleSearch();
  }, []);

  // 处理Select组件的清空操作（allowClear点击时触发）
  const handleRoleClear = useCallback(() => {
    setSelectedRole(undefined);
    setFloatKey(k => k + 1); // 强制重新渲染Select组件
    handleSearch();
  }, []);

  // 使用 useMemo 缓存 filterControls 以避免重渲染
  const filterControls = useMemo(() => [
    <div key="name" style={inputStyleName}>
      <Input
        ref={nameInputRef}
        placeholder={t('userList.filters.searchUser', '搜索用户名或昵称')}
        allowClear
        style={inputStyle}
        onKeyPress={handleNameKeyPress}
        autoComplete="off"
        key={`name-input-${inputResetKey}`}
      />
    </div>,
    <div key="role" style={selectStyleRole}>
      <Select
        placeholder={t('userList.allRoles', '全部角色')}
        allowClear
        style={inputStyle}
        value={selectedRole}
        onChange={handleRoleChange}
        onClear={handleRoleClear}
        key={`role-select-${selectKey}`}
      >
        <Option value="ADMIN">{t('user.role.ADMIN', '管理员')}</Option>
        <Option value="APPLIER">{t('user.role.APPLIER', '申请人')}</Option>
        <Option value="APPROVER">{t('user.role.APPROVER', '审批人')}</Option>
        <Option value="SERVICE">{t('user.role.SERVICE', '服务人员')}</Option>
        <Option value="MAINTAINER">{t('user.role.MAINTAINER', '维修人员')}</Option>
      </Select>
    </div>,
    <div key="actions" style={actionsStyle}>
      <Button
        type="primary"
        icon={<SearchOutlined />}
        onClick={handleSearch}
        loading={usersLoading}
      >
        {t('common.search', '搜索')}
      </Button>
      <Button
        onClick={handleClearFilters}
      >
        {t('common.clearFilters', '清空筛选')}
      </Button>
    </div>
  ], [
    inputStyleName,
    selectStyleRole,
    actionsStyle,
    inputStyle,
    t,
    selectedRole,
    handleNameKeyPress,
    handleRoleChange,
    handleRoleClear,
    handleSearch,
    handleClearFilters,
    usersLoading,
    inputResetKey,
    selectKey,
    floatKey
  ]);

  // 定义 actions，必须在所有条件渲染之前
  const actions = useMemo(() => [
    <ResponsiveButton
      icon={<ReloadOutlined />}
      onClick={() => {
        // 刷新时使用当前搜索框的实际值，并进行安全性验证
        const nameValue = (nameInputRef.current?.input?.value || '').substring(0, 100);

        // 基本的输入清理，防止潜在的安全问题
        const cleanName = nameValue.replace(/[<>\"'&]/g, '').trim();

        const currentParams = {
          name: cleanName || undefined,
          role: currentRoleRef.current || undefined, // 使用当前的selectedRole状态
          pageNum: 1,
          pageSize: 20
        };

        // 同步更新 searchParams，确保 "x条" 文字提示正确显示
        setSearchParams(prev => ({ ...prev, ...currentParams }));

        // 更新筛选状态
        const hasFilters = cleanName || currentRoleRef.current;
        setIsFiltering(!!hasFilters);

        // 如果有筛选条件，保持筛选器展开状态
        if (hasFilters && isFilterCollapsed) {
          setIsFilterCollapsed(false);
        }

        // 清空用户列表，但不预设 total，让 fetchUsers 的结果来决定 total
        setUsers([]);
        fetchUsers(currentParams, false);
      }}
      loading={usersLoading}
      style={{ marginLeft: '8px' }}
    >
      {t('common.refresh', '刷新')}
    </ResponsiveButton>,
    canCreateUser(user?.role) && (
      <ResponsiveButton
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleCreateUser}
        style={{ marginLeft: '8px' }}
      >
        {t('userList.createUser', '创建用户')}
      </ResponsiveButton>
    )
  ], [selectedRole, usersLoading, isFilterCollapsed, setSearchParams, setIsFiltering, setIsFilterCollapsed, setUsers, fetchUsers, user?.role, handleCreateUser, t]);






  // 已废弃分页控件逻辑





  // 无限滚动相关
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const listRef = useRef(null);

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
            className: 'modal-btn-row'
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

  const listItemBody = (item) => (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>{item.username}</span>
        <Tag color={item.role === 'ADMIN' ? 'red' : item.role === 'APPROVER' ? 'blue' : item.role === 'APPLIER' ? 'green' : item.role === 'SERVICE' ? 'orange' : 'purple'}>
          {getRoleDisplayName(item.role)}
        </Tag>
        <span style={{ color: '#888', fontSize: 12 }}>{item.nickname}</span>
      </div>
      <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
        {item.email || '-'}
      </div>
    </div>
  );


  const ListProps = {
    dataSource: users,
    loading: usersLoading && users.length === 0 && !usersError,
    locale: { emptyText: usersError ? t('userList.errors.dataFetchFail', '获取用户列表失败') : t('userList.empty', '暂无用户') }
  };

  const error = usersError && {
    title: t('userList.errors.dataFetchFail', '获取用户列表失败'),
    description: String(usersError.message),
  };


  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}
      {contextHolderModal}

      <ManagementPageContainerM
        key={`${searchParams.pageNum}-${searchParams.name}-${searchParams.role}`}
        actions={actions}
        filterThreshold={700}
        filterControls={filterControls}
        ListProps={ListProps}
        totalValue={total}
        fetchMore={fetchUsers}
        handleViewDetail={handleViewDetail}
        listItemBody={listItemBody}
        lengthOfData={users.length}
        setFloatContent={props.setFloatContent}
        searchParams={searchParams}
        isFilterCollapsed={isFilterCollapsed}
        onToggleFilter={toggleFilter}
        isFiltering={isFiltering}
      />

      {/* 抽屉组件 */}
      <Drawer
        title={
          drawerType === 'detail' ? t('userList.drawer.detail', '用户详情') :
            drawerType === 'edit' ? t('userList.drawer.edit', '编辑用户') :
              drawerType === 'create' ? t('userList.drawer.create', '创建用户') : ''
        }
        placement="bottom"
        height="80vh"
        open={drawerVisible}
        onClose={handleCloseDrawer}
        closable={false}
        bodyStyle={{ padding: 16 }}
        style={{ borderRadius: '16px 16px 0 0' }}
        footer={
          drawerType === 'detail' && currentUser ? (
            <div style={{ margin: 8 }}>
              <Button
                type="primary"
                style={{ width: '100%', marginBottom: 12 }}
                onClick={() => handleEdit(currentUser)}
              >
                {t('common.edit', '编辑')}
              </Button>
              <Button
                danger
                style={{ width: '100%', marginBottom: 12 }}
                onClick={() => handleDeleteUser(currentUser)}
              >
                {t('common.delete', '删除')}
              </Button>
              <Button
                style={{ width: '100%' }}
                onClick={handleCloseDrawer}
              >
                {t('common.close', '关闭')}
              </Button>
            </div>
          ) : (drawerType === 'edit' || drawerType === 'create') ? (
            <div style={{ margin: 8 }}>
              <Button
                type="primary"
                style={{ width: '100%', marginBottom: 12 }}
                onClick={() => form.submit()}
              >
                {drawerType === 'create' ? t('common.create', '创建') : t('common.save', '保存')}
              </Button>
              <Button
                style={{ width: '100%' }}
                onClick={handleCloseDrawer}
              >
                {t('common.cancel', '取消')}
              </Button>
            </div>
          ) : (
            <Button
              style={{ width: '100%' }}
              onClick={handleCloseDrawer}
            >
              {t('common.close', '关闭')}
            </Button>
          )
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
        destroyOnHidden
        confirmLoading={false}
        footer={[
          <div key="modal-btn-row" style={{ display: 'flex', gap: 8, margin: '16px 0 0 0' }}>
            <Button
              key="cancel"
              style={{ flex: 1 }}
              onClick={handleSecondConfirmCancel}
            >
              {t('common.cancel', '取消')}
            </Button>
            <Button
              key="ok"
              type="primary"
              danger
              style={{ flex: 1 }}
              loading={false}
              onClick={handleSecondConfirm}
            >
              {t('userList.secondConfirm.confirmDelete', '确认删除')}
            </Button>
          </div>
        ]}
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