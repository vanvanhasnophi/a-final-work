import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Button, Form, Input, DatePicker, Select, message, Tag, Drawer, Descriptions, Divider, App, Switch
} from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useApiWithRetry } from '../../hooks/useApiWithRetry';
import { usePageRefresh } from '../../hooks/usePageRefresh';
import PageErrorBoundary from '../../components/PageErrorBoundary';
import ManagementPageContainerM from '../../components/ManagementPageContainerM';

import {
  canViewAllApplications, canViewOwnApplications, canApproveApplication,
  canCancelApplication
} from '../../utils/permissionUtils';
import { applicationAPI } from '../../api/application';
import { formatDateTime, formatTimeRange } from '../../utils/dateFormat';
import { getApplicationStatusDisplayName, getApplicationStatusColor, isApplicationExpired } from '../../utils/statusMapping';
import { useI18n } from '../../contexts/I18nContext';
import { getUserDisplayName } from '../../utils/userDisplay';
import ResponsiveButton from '../../components/ResponsiveButton';

const { Option } = Select;

// 主要组件内容
function ApplicationManagementContent({ setFloatContent }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useState({
    pageNum: 1,
    pageSize: 20,
  });
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [authError, setAuthError] = useState(null);

  // 筛选控件状态
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const [showExpired, setShowExpired] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  // 筛选状态管理
  const [isFiltering, setIsFiltering] = useState(false);
  const [inputResetKey, setInputResetKey] = useState(0);
  const [selectKey, setSelectKey] = useState(0);
  const [floatKey, setFloatKey] = useState(0);

  // 添加 ref 来直接访问输入框的值
  const roomInputRef = useRef(null);
  const applicantInputRef = useRef(null);
  
  // 添加状态和日期的 ref 来避免状态更新延迟
  const selectedStatusRef = useRef(selectedStatus);
  const selectedDateRef = useRef(selectedDate);

  // 保持 ref 与 state 同步
  useEffect(() => {
    selectedStatusRef.current = selectedStatus;
  }, [selectedStatus]);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'detail', 'approve', 'cancel'
  const [currentApplication, setCurrentApplication] = useState(null);


  const { loading: applicationsLoading, error: applicationsError, executeWithRetry: executeApplications } = useApiWithRetry();
  // 获取申请列表
  const fetchApplications = useCallback(async (params = {}, append = false) => {
    const result = await executeApplications(
      async () => {
        const currentSearchParams = searchParams;
        const requestParams = {
          ...currentSearchParams,
          ...params,
        };

        console.log('发送申请分页请求参数:', requestParams);
        const response = await applicationAPI.getApplicationList(requestParams);

        const { records, total: totalCount } = response.data;
        console.log('申请分页响应数据:', response.data);

        const finalRecords = Array.isArray(records) ? records : [];
        const finalTotal = (typeof totalCount === 'number' && totalCount >= 0) ? totalCount : 0;

        if (append) {
          setApplications(prev => [...prev, ...finalRecords]);
        } else {
          setApplications(finalRecords);
        }
        setTotal(finalTotal);
        setFloatKey(k => k + 1);

        setAuthError(null);

        return response.data;
      },
      {
        errorMessage: t('applicationManagement.error.fetchListFail'),
        maxRetries: 0,
        retryDelay: 0,
        onError: (error) => {
          if (error.response?.status === 401) {
            setAuthError(t('applicationManagement.auth.tokenExpired'));
            messageApi.error(t('applicationManagement.auth.tokenExpired'));
          } else if (error.response?.status === 403) {
            setAuthError(t('applicationManagement.auth.forbidden'));
            messageApi.error(t('applicationManagement.auth.forbidden'));
          }
        }
      }
    );
    return result;
  }, [executeApplications, searchParams, messageApi, t]);

  // 初始化加载
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // 页面刷新Hook
  const handlePageRefresh = usePageRefresh(() => {
    fetchApplications();
  });

  // 使用 ref 值的即时搜索函数
  const handleSearchWithRef = useCallback(() => {
    // 从 ref 直接获取搜索框的当前值，并进行安全性验证
    const roomValue = (roomInputRef.current?.input?.value || '').substring(0, 100);
    const applicantValue = (applicantInputRef.current?.input?.value || '').substring(0, 100);

    // 基本的输入清理，防止潜在的安全问题
    const cleanRoomName = roomValue.replace(/[<>\"'&]/g, '').trim();
    const cleanUsername = applicantValue.replace(/[<>\"'&]/g, '').trim();

    // 使用 ref 中的最新值
    const currentStatus = selectedStatusRef.current;
    const currentDate = selectedDateRef.current;

    const newParams = {
      roomName: cleanRoomName || undefined,
      user: cleanUsername || undefined,
      status: currentStatus || undefined,
      queryDate: currentDate ? currentDate.format('YYYY-MM-DD') : undefined,
      showExpired: showExpired,
      pageNum: 1
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    setApplications([]);
    setTotal(0);
    fetchApplications(newParams, false);

    // 更新筛选状态 - showExpired 不算作筛选条件
    const hasFilters = cleanRoomName || cleanUsername || currentStatus || currentDate;
    setIsFiltering(!!hasFilters);

    // 如果有筛选条件，保持筛选器展开状态以便用户查看/修改条件
    if (hasFilters && isFilterCollapsed) {
      setIsFilterCollapsed(false);
    }

    setFloatKey(k => k + 1); // 确保筛选按钮颜色立即更新
  }, [fetchApplications, isFilterCollapsed, showExpired]);

  // 手动搜索函数
  const handleSearch = useCallback(() => {
    // 从 ref 直接获取搜索框的当前值，并进行安全性验证
    const roomValue = (roomInputRef.current?.input?.value || '').substring(0, 100);
    const applicantValue = (applicantInputRef.current?.input?.value || '').substring(0, 100);

    // 基本的输入清理，防止潜在的安全问题
    const cleanRoomName = roomValue.replace(/[<>\"'&]/g, '').trim();
    const cleanUsername = applicantValue.replace(/[<>\"'&]/g, '').trim();

    const newParams = {
      roomName: cleanRoomName || undefined,
      user: cleanUsername || undefined,
      status: selectedStatus || undefined,
      queryDate: selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined,
      showExpired: showExpired,
      pageNum: 1
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    setApplications([]);
    setTotal(0);
    fetchApplications(newParams, false);

    // 更新筛选状态 - showExpired 不算作筛选条件
    const hasFilters = cleanRoomName || cleanUsername || selectedStatus || selectedDate;
    setIsFiltering(!!hasFilters);

    // 如果有筛选条件，保持筛选器展开状态以便用户查看/修改条件
    if (hasFilters && isFilterCollapsed) {
      setIsFilterCollapsed(false);
    }

    setFloatKey(k => k + 1); // 确保筛选按钮颜色立即更新
  }, [selectedStatus, selectedDate, showExpired, fetchApplications, isFilterCollapsed]);

  // 处理回车搜索
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  // 计算过期申请数量
  const expiredCount = useMemo(() => {
    return applications.filter(app => isApplicationExpired(app)).length;
  }, [applications]);

  // 构建显示的总数文本
  const displayExpired = useMemo(() => {
    if (showExpired && expiredCount > 0) {
      return t('applicationManagement.filters.expiredCount','，过期 {count} 条').replace('{count}', expiredCount);
    }
    return '';
  }, [total, showExpired, expiredCount]);

  // 切换筛选器显示/隐藏
  const toggleFilter = useCallback(() => {
    setIsFilterCollapsed(prev => !prev);
  }, []);

  // List项内容渲染函数
  const listItemBody = useCallback((item) => {
    const timeRange = formatTimeRange(item.startTime, item.endTime, { structured: false });
    const isExpired = isApplicationExpired(item);

    return (
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        opacity: isExpired ? 0.5 : 1 // 已过期的项目置灰
      }}>
        {/* 教室名称和状态 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            color: 'var(--text-color)',
            lineHeight: '1.4',
            flex: 1
          }}>
            {item.roomName}
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '4px', 
            flexWrap: 'wrap', 
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}>
            <Tag color={getApplicationStatusColor(item.status)}>
              {getApplicationStatusDisplayName(item.status)}
            </Tag>
            {isExpired && (
              <Tag color="default">
                {t('applicationManagement.statusOptions.EXPIRED', '已过期')}
              </Tag>
            )}
          </div>
        </div>

        {/* 申请人信息 */}
        <div style={{
          fontSize: '14px',
          color: 'var(--text-color-secondary)',
          lineHeight: '1.4'
        }}>
          <span>{t('applicationManagement.descriptions.applicant', '申请人')}：</span>
          <span>{getUserDisplayName({ nickname: item.userNickname, username: item.username })}</span>
        </div>

        {/* 使用时间 - 去掉标签，不换行 */}
        <div style={{
          fontSize: '14px',
          color: 'var(--text-color-secondary)',
          lineHeight: '1.4'
        }}>
          <span className="num-mono" data-field="timeRange">
            {timeRange}
          </span>
        </div>

        {/* 申请原因（如果有） - 去掉标签 */}
        {item.reason && (
          <div style={{
            fontSize: '14px',
            color: 'var(--text-color-secondary)',
            lineHeight: '1.4'
          }}>
            <span>{item.reason}</span>
          </div>
        )}

        {/* 创建时间 - 加上"提交于"前缀 */}
        <div style={{
          fontSize: '12px',
          color: 'var(--text-color-tertiary)',
          lineHeight: '1.4'
        }}>
          <span className="num-mono" data-field="createTime">
            提交于 {formatDateTime(item.createTime)}
          </span>
        </div>
      </div>
    );
  }, [t]);

  // 筛选控件配置
  const filterControls = useMemo(() => [
    <div key={`room-search-${inputResetKey}`} style={{ minWidth: '200px' }}>
      <Input
        ref={roomInputRef}
        placeholder={t('applicationManagement.filters.roomSearchPlaceholder')}
        allowClear
        style={{ width: '100%' }}
        onKeyPress={handleKeyPress}
        autoComplete="off"
      />
    </div>,
    <div key={`applicant-search-${inputResetKey}`} style={{ minWidth: '150px' }}>
      <Input
        ref={applicantInputRef}
        placeholder={t('applicationManagement.filters.applicantSearchPlaceholder')}
        allowClear
        style={{ width: '100%' }}
        onKeyPress={handleKeyPress}
        autoComplete="off"
      />
    </div>,
    <div key={`status-select-${selectKey}`} style={{ minWidth: '120px' }}>
      <Select
        placeholder={t('applicationManagement.filters.statusPlaceholder')}
        allowClear
        style={{ width: '100%' }}
        value={selectedStatus}
        onChange={(value) => {
          selectedStatusRef.current = value; // 立即更新 ref
          setSelectedStatus(value);
          setFloatKey(k => k + 1);
          setSelectKey(k => k + 1);
          handleSearchWithRef(); // 使用 ref 值搜索
        }}
      >
        <Option value="PENDING">{t('applicationManagement.statusOptions.PENDING')}</Option>
        <Option value="PENDING_CHECKIN">{t('applicationManagement.statusOptions.PENDING_CHECKIN')}</Option>
        <Option value="IN_USE">{t('applicationManagement.statusOptions.IN_USE')}</Option>
        <Option value="APPROVED">{t('applicationManagement.statusOptions.APPROVED')}</Option>
        <Option value="REJECTED">{t('applicationManagement.statusOptions.REJECTED')}</Option>
        <Option value="CANCELLED">{t('applicationManagement.statusOptions.CANCELLED')}</Option>
        <Option value="COMPLETED">{t('applicationManagement.statusOptions.COMPLETED')}</Option>
      </Select>
    </div>,
    <div key={`date-picker-${inputResetKey}`} style={{ minWidth: '150px' }}>
      <DatePicker
        style={{ width: '100%' }}
        placeholder={t('applicationManagement.filters.datePlaceholder')}
        format="YYYY-MM-DD"
        value={selectedDate}
        onChange={(date) => {
          selectedDateRef.current = date; // 立即更新 ref
          setSelectedDate(date);
          setFloatKey(k => k + 1);
          handleSearchWithRef(); // 使用 ref 值搜索
        }}
      />
    </div>,
    <div key={`expired-switch-${inputResetKey}`} style={{ minWidth: '120px', display: 'flex', alignItems: 'center' }}>
      <Switch
        checked={showExpired}
        onChange={(checked) => {
          setShowExpired(checked);
          const newParams = { showExpired: checked, pageNum: 1 };
          setSearchParams(prev => ({ ...prev, ...newParams }));
          setFloatKey(k => k + 1);
          fetchApplications(newParams);
        }}
      />
      <span style={{ marginLeft: '8px' }}>
        {t('applicationManagement.filters.showExpired', '显示过期申请')}
      </span>
    </div>,
    <div key="actions" style={{ display: 'flex', gap: '8px' }}>
      <Button
        type="primary"
        icon={<SearchOutlined />}
        onClick={handleSearch}
        className="drawer-row-btn-mobile"
      >
        {t('common.search', '搜索')}
      </Button>
      <Button
        onClick={() => {
          // 重置所有筛选状态
          setSelectedDate(null);
          setSelectedStatus(undefined);
          setShowExpired(false);

          // 重置重新渲染键
          setInputResetKey(k => k + 1);
          setSelectKey(k => k + 1);

          // 清空搜索参数并刷新数据
          const newParams = {
            pageNum: 1,
            roomName: undefined,
            user: undefined,
            status: undefined,
            queryDate: undefined,
            showExpired: false
          };
          setSearchParams(newParams);
          setApplications([]);
          setTotal(0);
          fetchApplications(newParams, false);
          setIsFiltering(false);
          setFloatKey(k => k + 1);
        }}
        className="drawer-row-btn-mobile"
      >
        {t('applicationManagement.filters.clearFilters')}
      </Button>
    </div>
  ], [inputResetKey, selectKey, selectedStatus, selectedDate, showExpired, handleKeyPress, handleSearch, handleSearchWithRef, t, fetchApplications, setSearchParams, setIsFiltering, setInputResetKey, setSelectKey, setSelectedDate, setSelectedStatus, setShowExpired, setFloatKey, setApplications, setTotal]);

  // 操作按钮配置
  const actions = useMemo(() => [
    <ResponsiveButton
      key="refresh"
      type="primary"
      icon={<ReloadOutlined />}
      loading={applicationsLoading}
      onClick={() => fetchApplications()}
      style={{ marginLeft: '8px' }}
    >
      {t('common.refresh')}
    </ResponsiveButton>
  ], [t, fetchApplications, applicationsLoading]);

  // List组件配置
  const ListProps = useMemo(() => ({
    dataSource: applications,
    loading: applicationsLoading,
    rowKey: 'id'
  }), [applications, applicationsLoading]);

  // 打开详情抽屉
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

  // 打开撤销抽屉
  const handleCancel = (record) => {
    setDrawerType('cancel');
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
      if (drawerType === 'approve') {
        await executeApplications(
          async () => {
            const approvalData = {
              applicationId: currentApplication.id,
              approved: values.approved,
              reason: values.reason
            };
            const response = await applicationAPI.approveApplication(approvalData);
            messageApi.success(values.approved
              ? t('applicationManagement.messages.approveApproved')
              : t('applicationManagement.messages.approveRejected')
            );
            handleCloseDrawer();
            fetchApplications();
            return response;
          },
          {
            errorMessage: t('applicationManagement.messages.approveFail'),
            successMessage: t('applicationManagement.messages.approveSuccess')
          }
        );
      } else if (drawerType === 'cancel') {
        await executeApplications(
          async () => {
            const cancelData = {
              applicationId: currentApplication.id,
              reason: values.reason
            };
            const response = await applicationAPI.cancelApplication(cancelData);
            messageApi.success(t('applicationManagement.messages.cancelSuccess'));
            handleCloseDrawer();
            fetchApplications();
            return response;
          },
          {
            errorMessage: t('applicationManagement.messages.cancelFail'),
            successMessage: t('applicationManagement.messages.cancelSuccess')
          }
        );
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  // 权限检查
  const canView = canViewAllApplications(user?.role) || canViewOwnApplications(user?.role);
  const canApprove = canApproveApplication(user?.role);
  const canCancel = canCancelApplication(user?.role);

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}

      <ManagementPageContainerM
        key={`${searchParams.pageNum}-${searchParams.roomName}-${searchParams.username}-${searchParams.status}-${floatKey}`}
        actions={actions}
        filterThreshold={1510}
        filterControls={filterControls}
        ListProps={ListProps}
        totalValue={total}
        expiredSuffix={displayExpired}
        fetchMore={fetchApplications}
        handleViewDetail={handleViewDetail}
        listItemBody={listItemBody}
        lengthOfData={applications.length}
        setFloatContent={setFloatContent}
        searchParams={searchParams}
        isFilterCollapsed={isFilterCollapsed}
        onToggleFilter={toggleFilter}
        isFiltering={isFiltering}
      />

      {/* 抽屉组件 */}
      <Drawer
        title={
          drawerType === 'detail' ? t('applicationManagement.drawer.detail') :
            drawerType === 'approve' ? t('applicationManagement.drawer.approve') :
              drawerType === 'cancel' ? t('applicationManagement.drawer.cancel') : ''
        }
        placement="bottom"
        open={drawerVisible}
        onClose={handleCloseDrawer}
        closable={false}
        bodyStyle={{ padding: 16 }}
        className="drawer-mobile"
        footer={
          drawerType === 'detail' && currentApplication ? (
            <div style={{ margin: 8 }}>
              {canApprove && currentApplication.status === 'PENDING' && (
                <Button
                  type="primary"
                  style={{ marginBottom: 12 }}
                  className='drawer-row-btn-mobile'
                  onClick={() => handleApprove(currentApplication)}
                >
                  {t('applicationManagement.drawer.approve', '审批')}
                </Button>
              )}
              {canCancel && (currentApplication.status === 'PENDING' || currentApplication.status === 'APPROVED' || currentApplication.status === 'PENDING_CHECKIN' || currentApplication.status === 'IN_USE') && (
                <Button
                  danger
                  style={{ marginBottom: 12 }}
                  className='drawer-row-btn-mobile'
                  onClick={() => handleCancel(currentApplication)}
                >
                  {t('applicationManagement.drawer.cancel', '取消申请')}
                </Button>
              )}
              <Button
                className='drawer-row-btn-mobile'
                onClick={handleCloseDrawer}
              >
                {t('common.close', '关闭')}
              </Button>
            </div>
          ) : (drawerType === 'approve' || drawerType === 'cancel') ? (
            <div style={{ margin: 8 }}>
              <Button
                type="primary"
                danger={drawerType === 'cancel'}
                style={{  marginBottom: 12 }}
                className='drawer-row-btn-mobile'
                onClick={() => form.submit()}
              >
                {drawerType === 'cancel' ? t('applicationManagement.messages.cancelConfirmOk', '确认撤消') : t('common.confirm', '确认')}
              </Button>
              <Button
                className='drawer-row-btn-mobile'
                onClick={handleCloseDrawer}
              >
                {t('common.cancel', '取消')}
              </Button>
            </div>
          ) : (
            <Button
              className='drawer-row-btn-mobile'
              onClick={handleCloseDrawer}
            >
              {t('common.close', '关闭')}
            </Button>
          )
        }
      >
        {drawerType === 'detail' && currentApplication && (
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
                  <strong>{t('applicationManagement.descriptions.applicant', '申请人')}：</strong>
                  <span>{getUserDisplayName({ nickname: currentApplication.userNickname, username: currentApplication.username })}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('applicationManagement.descriptions.roomName', '教室名称')}：</strong>
                  <span>{currentApplication.roomName}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('applicationManagement.descriptions.time', '使用时间')}：</strong>
                  <span className="num-mono" data-field="timeRange">
                    {formatTimeRange(currentApplication.startTime, currentApplication.endTime, { structured: false })}
                  </span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('applicationManagement.descriptions.status', '状态')}：</strong>
                  <div style={{ 
                    display: 'flex', 
                    gap: '4px', 
                    flexWrap: 'wrap', 
                    justifyContent: 'flex-start',
                    alignItems: 'center'
                  }}>
                    <Tag color={getApplicationStatusColor(currentApplication.status)}>
                      {getApplicationStatusDisplayName(currentApplication.status)}
                    </Tag>
                    {isApplicationExpired(currentApplication) && (
                      <Tag color="default">
                        {t('applicationManagement.statusOptions.EXPIRED', '已过期')}
                      </Tag>
                    )}
                  </div>
                </div>
                {currentApplication.reason && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>{t('applicationManagement.descriptions.reason', '申请原因')}：</strong>
                    <span>{currentApplication.reason}</span>
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('applicationManagement.descriptions.createTime', '创建时间')}：</strong>
                  <span className="num-mono" data-field="createTime">{formatDateTime(currentApplication.createTime)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {(drawerType === 'approve' || drawerType === 'cancel') && currentApplication && (
          <div>

            <Descriptions column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label={t('applicationManagement.descriptions.applicant')}>{currentApplication.username}</Descriptions.Item>
              <Descriptions.Item label={t('applicationManagement.descriptions.roomName')}>{currentApplication.roomName}</Descriptions.Item>
              <Descriptions.Item label={t('applicationManagement.descriptions.time')}>
                <span className="num-mono" data-field="timeRange">
                  {formatTimeRange(currentApplication.startTime, currentApplication.endTime, { structured: false })}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              {drawerType === 'approve' && (
                <Form.Item
                  name="approved"
                  label={t('applicationManagement.form.approveResult')}
                  rules={[{ required: true, message: t('applicationManagement.form.pleaseSelectApproveResult') }]}
                >
                  <Select placeholder={t('applicationManagement.form.pleaseSelectApproveResult')}>
                    <Option value={true}>{t('applicationManagement.form.approveOptionApprove')}</Option>
                    <Option value={false}>{t('applicationManagement.form.approveOptionReject')}</Option>
                  </Select>
                </Form.Item>
              )}

              {drawerType === 'cancel' && currentApplication && (
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: 'var(--fill-color)', borderRadius: 6 }}>
                  {currentApplication.status === 'APPROVED' && (
                    <span>{t('applicationManagement.messages.cancelConfirmContentApproved')}</span>
                  )}
                  {currentApplication.status === 'PENDING_CHECKIN' && (
                    <span>{t('applicationManagement.messages.cancelConfirmContentPendingCheckin')}</span>
                  )}
                  {currentApplication.status === 'IN_USE' && (
                    <span>{t('applicationManagement.messages.cancelConfirmContentInUse')}</span>
                  )}
                  {currentApplication.status === 'PENDING' && (
                    <span>{t('applicationManagement.messages.cancelConfirmContent')}</span>
                  )}
                </div>
              )}

              <Form.Item
                name="reason"
                label={drawerType === 'approve' ? t('applicationManagement.form.approveOpinion') : t('applicationManagement.form.cancelReason')}
                rules={[{ required: true, message: drawerType === 'approve' ? t('applicationManagement.form.enterApproveOpinion') : t('applicationManagement.form.enterCancelReason') }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder={drawerType === 'approve' ? t('applicationManagement.form.enterApproveOpinion') : t('applicationManagement.form.enterCancelReason')}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>
    </PageErrorBoundary>
  );
}

// 导出的主组件，用 App 包装以提供 modal 上下文
export default function ApplicationManagement(props) {
  return (
    <App>
      <ApplicationManagementContent setFloatContent={props.setFloatContent} />
    </App>
  );
}