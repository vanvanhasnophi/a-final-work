import '../../styles/modal-btn-row.css';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  List, Button, Input, DatePicker, Select,
  message, Tag, Drawer,
  App, Switch
} from 'antd';
import {
  EyeOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApiWithRetry } from '../../hooks/useApiWithRetry';
import { usePageRefresh } from '../../hooks/usePageRefresh';
import PageErrorBoundary from '../../components/PageErrorBoundary';
import ManagementPageContainerM from '../../components/ManagementPageContainerM';

import { applicationAPI } from '../../api/application';
import { roomAPI } from '../../api/room';
import { formatDateTime, formatTimeRange } from '../../utils/dateFormat';
import { getApplicationStatusDisplayName, getApplicationStatusColor, isApplicationExpired } from '../../utils/statusMapping';
import { useI18n } from '../../contexts/I18nContext';
import ResponsiveButton from '../../components/ResponsiveButton';

const { Option } = Select;

// 主要组件内容
function MyApplicationsContent({ setFloatContent }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useState({
    pageNum: 1,
    pageSize: 20,
    userId: user?.id, // 默认只显示自己的申请
  });
  const [messageApi, contextHolder] = message.useMessage();
  const [authError, setAuthError] = useState(null);

  // 筛选控件状态
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const [selectedRoom, setSelectedRoom] = useState(undefined);
  const [showExpired, setShowExpired] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  // 筛选状态管理
  const [isFiltering, setIsFiltering] = useState(false);
  const [inputResetKey, setInputResetKey] = useState(0);
  const [selectKey, setSelectKey] = useState(0);
  const [floatKey, setFloatKey] = useState(0);

  // 添加 ref 来直接访问输入框的值
  const roomInputRef = useRef(null);

  // 添加状态的 ref 来避免状态更新延迟
  const selectedStatusRef = useRef(selectedStatus);
  const selectedDateRef = useRef(selectedDate);
  const selectedRoomRef = useRef(selectedRoom);

  // 保持 ref 与 state 同步
  useEffect(() => {
    selectedStatusRef.current = selectedStatus;
  }, [selectedStatus]);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'detail', 'cancel'
  const [currentApplication, setCurrentApplication] = useState(null);
  const [rooms, setRooms] = useState([]);

  // API 调用相关
  const { loading: applicationsLoading, error: applicationsError, executeWithRetry: executeApplications } = useApiWithRetry();

  // 获取申请列表
  const fetchApplications = useCallback(async (params = {}, append = false) => {
    const result = await executeApplications(
      async () => {
        const currentSearchParams = searchParams;
        const requestParams = {
          ...currentSearchParams,
          ...params,
          userId: user?.id, // 确保只获取当前用户的申请
        };

        console.log('发送我的申请分页请求参数:', requestParams);
        const response = await applicationAPI.getApplicationList(requestParams);

        const { records, total: totalCount } = response.data;
        console.log('我的申请分页响应数据:', response.data);

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
        errorMessage: t('myApplications.error.fetchListFail'),
        maxRetries: 0,
        retryDelay: 0,
        onError: (error) => {
          if (error.response?.status === 401) {
            setAuthError(t('myApplications.error.tokenExpired'));
            messageApi.error(t('myApplications.error.tokenExpired'));
          } else if (error.response?.status === 403) {
            setAuthError(t('myApplications.error.forbidden'));
            messageApi.error(t('myApplications.error.forbidden'));
          }
        }
      }
    );
    return result;
  }, [executeApplications, searchParams, user?.id, messageApi, t]);

  // 获取房间列表用于筛选
  const fetchRooms = useCallback(async () => {
    try {
      const response = await roomAPI.getRoomList({ pageSize: 1000 });
      setRooms(response.data.records || []);
    } catch (error) {
      console.error('获取房间列表失败:', error);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    fetchApplications();
    fetchRooms();
  }, [fetchApplications, fetchRooms]);

  // 页面刷新Hook
  const handlePageRefresh = usePageRefresh(() => {
    fetchApplications();
  });

  // 使用 ref 值的即时搜索函数
  const handleSearchWithRef = useCallback(() => {
    // 从 ref 直接获取搜索框的当前值，并进行安全性验证
    const roomValue = (roomInputRef.current?.input?.value || '').substring(0, 100);

    // 基本的输入清理，防止潜在的安全问题
    const cleanRoomName = roomValue.replace(/[<>\"'&]/g, '').trim();

    // 使用 ref 中的最新值
    const currentStatus = selectedStatusRef.current;
    const currentDate = selectedDateRef.current;
    const currentRoom = selectedRoomRef.current;

    const newParams = {
      roomName: cleanRoomName || undefined,
      status: currentStatus || undefined,
      queryDate: currentDate ? currentDate.format('YYYY-MM-DD') : undefined,
      roomId: currentRoom || undefined,
      showExpired: showExpired,
      pageNum: 1
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    setApplications([]);
    setTotal(0);
    fetchApplications(newParams, false);

    // 更新筛选状态 - showExpired 不算作筛选条件
    const hasFilters = cleanRoomName || currentStatus || currentDate || currentRoom;
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

    // 基本的输入清理，防止潜在的安全问题
    const cleanRoomName = roomValue.replace(/[<>\"'&]/g, '').trim();

    const newParams = {
      roomName: cleanRoomName || undefined,
      status: selectedStatus || undefined,
      queryDate: selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined,
      roomId: selectedRoom || undefined,
      showExpired: showExpired,
      pageNum: 1
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    setApplications([]);
    setTotal(0);
    fetchApplications(newParams, false);

    // 更新筛选状态 - showExpired 不算作筛选条件
    const hasFilters = cleanRoomName || selectedStatus || selectedDate || selectedRoom;
    setIsFiltering(!!hasFilters);

    // 如果有筛选条件，保持筛选器展开状态以便用户查看/修改条件
    if (hasFilters && isFilterCollapsed) {
      setIsFilterCollapsed(false);
    }

    setFloatKey(k => k + 1); // 确保筛选按钮颜色立即更新
  }, [selectedStatus, selectedDate, selectedRoom, showExpired, fetchApplications, isFilterCollapsed]);

  // 处理回车搜索
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  // 切换筛选器显示/隐藏
  const toggleFilter = useCallback(() => {
    setIsFilterCollapsed(prev => !prev);
  }, []);

  // 计算过期申请数量
  const expiredCount = useMemo(() => {
    return applications.filter(app => isApplicationExpired(app)).length;
  }, [applications]);

  const displayExpired = useMemo(() => {
    if (showExpired && expiredCount > 0) {
      return t('myApplications.filters.expiredCount','，过期 {count} 条').replace('{count}', expiredCount);
    }
    return '';
  }, [total, showExpired, expiredCount]);

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
                {t('myApplications.statusOptions.EXPIRED', '已过期')}
              </Tag>
            )}
          </div>
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
        placeholder={t('myApplications.filters.roomSearchPlaceholder')}
        allowClear
        style={{ width: '100%' }}
        onKeyPress={handleKeyPress}
        autoComplete="off"
      />
    </div>,
    <div key={`status-select-${selectKey}`} style={{ minWidth: '120px' }}>
      <Select
        placeholder={t('myApplications.filters.statusPlaceholder')}
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
        <Option value="PENDING">{t('myApplications.statusOptions.PENDING')}</Option>
        <Option value="PENDING_CHECKIN">{t('myApplications.statusOptions.PENDING_CHECKIN')}</Option>
        <Option value="IN_USE">{t('myApplications.statusOptions.IN_USE')}</Option>
        <Option value="APPROVED">{t('myApplications.statusOptions.APPROVED')}</Option>
        <Option value="REJECTED">{t('myApplications.statusOptions.REJECTED')}</Option>
        <Option value="CANCELLED">{t('myApplications.statusOptions.CANCELLED')}</Option>
        <Option value="COMPLETED">{t('myApplications.statusOptions.COMPLETED')}</Option>
      </Select>
    </div>,
    <div key={`date-picker-${inputResetKey}`} style={{ minWidth: '150px' }}>
      <DatePicker
        style={{ width: '100%' }}
        placeholder={t('myApplications.filters.datePlaceholder')}
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
      <span style={{ marginLeft: 8, fontSize: 14 }}>
        {t('myApplications.filters.showExpired')}
      </span>
    </div>,
    <div key="search-button">
      <Button
        type="primary"
        icon={<SearchOutlined />}
        onClick={handleSearch}
      >
        {t('common.search')}
      </Button>
    </div>,
    <div key="clear-filters">
      <Button
        onClick={() => {
          // 清空输入框
          if (roomInputRef.current) {
            roomInputRef.current.input.value = '';
          }
          // 清空筛选控件内容
          setSelectedRoom(undefined);
          setSelectedDate(null);
          setSelectedStatus(undefined);
          // 清空搜索参数并刷新数据
          const newParams = {
            pageNum: 1,
            roomName: undefined,
            roomId: undefined,
            status: undefined,
            queryDate: undefined,
          };
          setSearchParams(prev => ({ ...prev, ...newParams }));
          setApplications([]);
          setTotal(0);
          setIsFiltering(false);
          setInputResetKey(k => k + 1);
          setSelectKey(k => k + 1);
          setFloatKey(k => k + 1);
          fetchApplications(newParams);
        }}
      >
        {t('myApplications.filters.clearFilters')}
      </Button>
    </div>
  ], [inputResetKey, selectKey, selectedRoom, selectedStatus, selectedDate, showExpired, handleKeyPress, handleSearchWithRef, t, rooms, fetchApplications]);

  // 操作按钮配置
  const actions = useMemo(() => [
    <ResponsiveButton
      key="refresh"
      icon={<ReloadOutlined />}
      onClick={handlePageRefresh}
      tooltip={t('common.refresh')}
      style={{ marginLeft: '8px' }}
    >
      {t('common.refresh')}
    </ResponsiveButton>,
    <ResponsiveButton
      key="new-application"
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => navigate('/rooms')}
      tooltip={t('myApplications.actions.newApplication')}
      style={{ marginLeft: '8px' }}
    >
      {t('myApplications.actions.newApplication')}
    </ResponsiveButton>
  ], [handlePageRefresh, navigate, t]);

  // 抽屉操作处理函数
  const handleViewDetail = useCallback((application) => {
    setCurrentApplication(application);
    setDrawerType('detail');
    setDrawerVisible(true);
  }, []);

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setDrawerType('');
    setCurrentApplication(null);
  };

  // 取消申请
  const handleCancelApplication = useCallback(async (applicationId) => {
    try {
      await applicationAPI.cancelApplication(applicationId);
      messageApi.success(t('myApplications.messages.cancelSuccess'));
      fetchApplications();
      handleCloseDrawer();
    } catch (error) {
      messageApi.error(t('myApplications.messages.cancelFail'));
    }
  }, [fetchApplications, messageApi, t]);

  // List组件配置
  const ListProps = useMemo(() => ({
    loading: applicationsLoading,
    dataSource: applications,
    renderItem: (item) => (
      <List.Item
        key={item.id}
      >
        {listItemBody(item)}
      </List.Item>
    )
  }), [applicationsLoading, applications, listItemBody, handleViewDetail, t, modal, handleCancelApplication]);

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}

      {/* 权限错误提示 */}
      {authError && (
        <div style={{
          padding: 16,
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: 6,
          marginBottom: 16,
          color: '#cf1322'
        }}>
          {authError}
        </div>
      )}

      <ManagementPageContainerM
        key={`${searchParams.pageNum}-${searchParams.roomName}-${searchParams.status}-${floatKey}`}
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
          drawerType === 'detail' ? t('myApplications.drawer.detail') : ''
        }
        placement="bottom"
        open={drawerVisible}
        onClose={handleCloseDrawer}
        closable={false}
        bodyStyle={{ padding: 16 }}
        className="drawer-mobile"
        footer={
          <div style={{ margin: 8 }}>
            {drawerType === 'detail' && currentApplication && (
              <>
                {(currentApplication.status === 'PENDING' || currentApplication.status === 'APPROVED') && (
                  <Button
                    danger
                    className="drawer-row-btn-mobile"
                    style={{ marginBottom: 12 }}
                    onClick={() => {
                      modal.confirm({
                        title: t('myApplications.confirmCancel.title'),
                        content: t('myApplications.confirmCancel.content'),
                        okText: t('common.confirm'),
                        okType: 'danger',
                        cancelText: t('common.cancel'),
                        onOk: () => handleCancelApplication(currentApplication.id),
                        className: 'modal-btn-row'
                      });
                    }}
                  >
                    {t('myApplications.actions.cancel')}
                  </Button>
                )}
              </>
            )}
            <Button
              onClick={handleCloseDrawer}
              className='drawer-row-btn-mobile'
            >
              {t('common.close','关闭')}
            </Button>
          </div>
        }
      >
        {drawerType === 'detail' && currentApplication && (
          <div style={{ paddingBottom: '120px' }}>
            <div style={{
              padding: '20px',
              backgroundColor: 'var(--component-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ color: 'var(--text-color)', fontSize: '15px', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px', color: 'var(--text-color-secondary)' }}>
                    {t('myApplications.descriptions.roomName')}
                  </div>
                  <div style={{ fontSize: '16px' }}>
                    {currentApplication.roomName}
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px', color: 'var(--text-color-secondary)' }}>
                    {t('myApplications.descriptions.time')}
                  </div>
                  <div style={{ fontSize: '16px' }}>
                    <span className="num-mono" data-field="timeRange">
                      {formatTimeRange(currentApplication.startTime, currentApplication.endTime, { structured: false })}
                    </span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px', color: 'var(--text-color-secondary)' }}>
                    {t('myApplications.descriptions.status')}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <Tag 
                      color={getApplicationStatusColor(currentApplication.status)}
                      style={{ fontSize: '14px', padding: '4px 8px' }}
                    >
                      {getApplicationStatusDisplayName(currentApplication.status)}
                    </Tag>
                    {isApplicationExpired(currentApplication) && (
                      <Tag color="default" style={{ fontSize: '14px', padding: '4px 8px' }}>
                        {t('myApplications.statusOptions.EXPIRED', '已过期')}
                      </Tag>
                    )}
                  </div>
                </div>
                
                {currentApplication.reason && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px', color: 'var(--text-color-secondary)' }}>
                      {t('myApplications.descriptions.reason')}
                    </div>
                    <div style={{ fontSize: '16px', lineHeight: '1.5' }}>
                      {currentApplication.reason}
                    </div>
                  </div>
                )}
                
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px', color: 'var(--text-color-secondary)' }}>
                    {t('myApplications.descriptions.createTime')}
                  </div>
                  <div style={{ fontSize: '16px' }}>
                    <span className="num-mono" data-field="createTime">
                      {formatDateTime(currentApplication.createTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </PageErrorBoundary>
  );
}

// 导出包装组件
export default function MyApplications(props) {
  return (
    <App>
      <MyApplicationsContent setFloatContent={props.setFloatContent} />
    </App>
  );
}
