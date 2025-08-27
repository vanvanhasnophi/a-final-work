import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Table, Card, Button, Space, Drawer, Form, Input, DatePicker, Select, Alert, Tag, Pagination, Checkbox, Tooltip, App } from 'antd';
import { EyeOutlined, PlusOutlined, ReloadOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { applicationAPI } from '../../api/application';
import { roomAPI } from '../../api/room';
import { useApiWithRetry } from '../../hooks/useApiWithRetry';
import { usePageRefresh } from '../../hooks/usePageRefresh';
import PageErrorBoundary from '../../components/PageErrorBoundary';
import { getApplicationStatusDisplayName, getApplicationStatusColor, isApplicationExpired } from '../../utils/statusMapping';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, formatTimeRange } from '../../utils/dateFormat';
import { useAuth } from '../../contexts/AuthContext';
import FixedTop from '../../components/FixedTop';
import ResponsiveButton from '../../components/ResponsiveButton';
import ResponsiveFilterContainer from '../../components/ResponsiveFilterContainer';
import FilterDropdownButton from '../../components/FilterDropdownButton';
import { MessageContext } from '../../App';
import { useI18n } from '../../contexts/I18nContext';

const { Option } = Select;

// 主要组件内容
function MyApplicationsContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const messageApi = useContext(MessageContext);
  const { t } = useI18n();
  const { modal } = App.useApp();
  const [applications, setApplications] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState({
    pageNum: 1,
    pageSize: 10,
    userId: user?.id, // 默认只显示自己的申请
  });
  const [form] = Form.useForm();
  const datePickerRef = useRef(null);
  const statusSelectRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const [selectedRoom, setSelectedRoom] = useState(undefined);
  const [showExpired, setShowExpired] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'detail', 'cancel'
  const [currentApplication, setCurrentApplication] = useState(null);
  
  const { loading: applicationsLoading, error: applicationsError, executeWithRetry: executeApplications } = useApiWithRetry();
  const { loading: roomsLoading, error: roomsError, executeWithRetry: executeRooms } = useApiWithRetry();
  
  // 页面刷新Hook
  const handlePageRefresh = usePageRefresh(() => {
    fetchApplications();
    fetchRooms();
  });

  // 获取申请列表
  const fetchApplications = useCallback(async (params = {}) => {
    const result = await executeApplications(
      async () => {
        // 获取当前的searchParams，避免闭包问题
        const currentSearchParams = searchParams;
        const requestParams = {
          ...currentSearchParams,
          ...params,
          userId: user?.id, // 始终只显示自己的申请
        };
        
        console.log('发送我的申请分页请求参数:', requestParams);
        const response = await applicationAPI.getApplicationList(requestParams);
        
        const { records, total, pageNum, pageSize } = response.data;
        console.log('我的申请分页响应数据:', response.data);
        
        setApplications(records || []);
        setPagination({
          current: pageNum || 1,
          pageSize: pageSize || 10,
          total: total || 0,
        });
        
        return response.data;
      },
      {
  errorMessage: t('applicationManagement.error.fetchListFail'),
        maxRetries: 0,
        retryDelay: 0
      }
    );
    return result;
  }, [executeApplications, user?.id]);

  // 获取教室列表（用于下拉选择）
  const fetchRooms = useCallback(async () => {
    const result = await executeRooms(
      async () => {
        const response = await roomAPI.getRoomList({ pageSize: 100 });
        setRooms(response.data.records || []);
        return response.data.records;
      },
      {
  errorMessage: t('roomList.error.fetchListFail'),
        maxRetries: 0,
        retryDelay: 0,
        showRetryMessage: false
      }
    );
    return result;
  }, [executeRooms]);

  // 初始化加载
  useEffect(() => {
    if (user?.id) {
      fetchApplications();
      fetchRooms();
    }
  }, [user?.id]); // 依赖用户ID

  // 处理表格分页变化
  const handleTableChange = (pagination, filters, sorter) => {
    console.log('我的申请表格分页变化:', pagination);
    const newParams = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchApplications(newParams);
  };

  // 跳转到教室列表页面进行申请
  const handleAddApplication = () => {
    navigate('/rooms');
  };

  // 打开详情抽屉
  const handleViewDetail = (record) => {
    setDrawerType('detail');
    setCurrentApplication(record);
    setDrawerVisible(true);
  };

  // 打开撤销申请抽屉
  const handleCancelApplication = (record) => {
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

  // 处理签到操作
  const handleCheckinApplication = (record) => {
    const roomName = record.roomName || t('applicationManagement.columns.roomName', '教室');
    const timeRange = formatTimeRange(record.startTime, record.endTime);
    
    modal.confirm({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckOutlined style={{ color: '#52c41a' }} />
          <span>{t('myApplications.actions.checkinConfirmTitle', '确认签到')}</span>
        </div>
      ),
      content: (
        <div>
          <p>{t('myApplications.actions.checkinConfirmContent', '确认对该申请进行签到吗？签到后将无法撤销。')}</p>
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: 'var(--background-color)', 
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>{t('applicationManagement.columns.roomName', '教室')}：</strong>{roomName}
            </div>
            <div>
              <strong>{t('applicationManagement.columns.usageTime', '使用时间')}：</strong>
              <span className="num-mono">{timeRange}</span>
            </div>
          </div>
        </div>
      ),
      okText: t('myApplications.actions.checkinConfirmOk', '确认签到'),
      cancelText: t('common.cancel', '取消'),
      okType: 'primary',
      autoFocusButton: 'ok',
      maskClosable: false,
      keyboard: false,
      width: 420,
      centered: true,
      zIndex: 10001,
      getContainer: () => document.body,
      destroyOnClose: true,
      okButtonProps: {
        style: { fontWeight: 600 },
        icon: <CheckOutlined />
      },
      cancelButtonProps: {
        style: { fontWeight: 400 }
      },
      onOk: async () => {
        try {
          await applicationAPI.checkinApplication(record.id);
          messageApi.success(t('myApplications.actions.checkinSuccess', '签到成功'));
          fetchApplications();
        } catch (e) {
          console.error('签到失败:', e);
          const errorMessage = e.response?.data || e.message || t('common.unknownError', '未知错误');
          messageApi.error(t('myApplications.actions.checkinFail', '签到失败') + '：' + errorMessage);
        }
      }
    });
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (drawerType === 'cancel') {
        await executeApplications(
          async () => {
            const response = await applicationAPI.cancelApplication({
              applicationId: currentApplication.id,
              reason: values.reason
            });
            messageApi.success(t('applicationManagement.messages.cancelSuccess'));
            handleCloseDrawer();
            fetchApplications(); // 刷新列表
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
      messageApi.error('操作失败，请重试');
    }
  };

  const columns = [
    {
  title: t('applicationManagement.columns.roomName'),
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
  title: t('applicationManagement.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const displayName = getApplicationStatusDisplayName(status);
        const color = getApplicationStatusColor(status);
        const isExpired = isApplicationExpired(record);
        
        return (
          <div>
            <Tag color={color}>{displayName}</Tag>
            {isExpired && (
              <Tag color="default" style={{ marginLeft: 4 }}>
                {t('applicationManagement.statusOptions.EXPIRED', '已过期')}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
  title: t('applicationManagement.columns.usageTime'),
      key: 'time',
      onCell: () => ({ 'data-field': 'timeRange' }),
      render: (_, record) => {
        const r = formatTimeRange(record.startTime, record.endTime, { structured: true });
        if (r.crossDay) {
          return (
            <div className="num-mono" data-field="timeRange">
              <div>{r.startFormatted} -</div>
              <div>{r.endFormatted}</div>
            </div>
          );
        }
        return <div className="num-mono" data-field="timeRange">{r.text || r}</div>;
      },
    },
    {
  title: t('applicationManagement.columns.reason'),
      dataIndex: 'reason',
      key: 'reason',
    },
    {
  title: t('applicationManagement.columns.createTime'),
      dataIndex: 'createTime',
      key: 'createTime',
      onCell: () => ({ 'data-field': 'createTime' }),
      render: (createTime) => (
        <span className="num-mono">{formatDateTime(createTime)}</span>
      ),
    },
    {
  title: t('applicationManagement.columns.actions'),
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={t('applicationManagement.tooltips.viewDetail')}>
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {(record.status === 'PENDING' || record.status === 'APPROVED' || record.status === 'PENDING_CHECKIN' || record.status === 'IN_USE') && (
            <Tooltip title={t('applicationManagement.tooltips.cancel')}>
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small" 
                style={{ color: '#ff4d4f' }}
                onClick={() => handleCancelApplication(record)}
              />
            </Tooltip>
          )}
          {record.status === 'PENDING_CHECKIN' && record.userId === user?.id && (
            <Tooltip title={t('myApplications.actions.checkin', '签到')}>
              <Button 
                type="primary"
                size="small"
                onClick={() => handleCheckinApplication(record)}
              >{t('myApplications.actions.checkin', '签到')}</Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{t('myApplications.title', t('applicationManagement.title'))}</span>
            {windowWidth >= 600 && (
              <span style={{ 
                fontSize: '12px', 
                color: 'var(--text-color-secondary)', 
                fontWeight: 'normal',
                backgroundColor: 'var(--fill-color-secondary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)'
              }}>
                {t('applicationManagement.badgeRetention')}
              </span>
            )}
          </div>
        }
        extra={
          <Space>
            {isFilterCollapsed && (
              <FilterDropdownButton>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  {/* 教室筛选 */}
                  <div style={{ minWidth: '200px' }}>
                    <Select
                      placeholder={t('myApplications.filters.allRooms', '全部教室')}
                      allowClear
                      style={{ width: '100%' }}
                      value={selectedRoom}
                      onChange={(value) => {
                        setSelectedRoom(value);
                        const newParams = { roomId: value || undefined, pageNum: 1 };
                        setSearchParams(prev => ({ ...prev, ...newParams }));
                        fetchApplications(newParams);
                      }}
                    >
                      {rooms.map(room => (
                        <Option key={room.id} value={room.id}>
                          {room.name} ({room.location})
                        </Option>
                      ))}
                    </Select>
                  </div>
                  
                  {/* 状态筛选 */}
                  <div style={{ minWidth: '120px' }}>
                    <Select
                      ref={statusSelectRef}
                      placeholder={t('applicationManagement.filters.statusPlaceholder')}
                      allowClear
                      style={{ width: '100%' }}
                      value={selectedStatus}
                      onChange={(value) => {
                        setSelectedStatus(value);
                        const newParams = { status: value || undefined, pageNum: 1 };
                        setSearchParams(prev => ({ ...prev, ...newParams }));
                        fetchApplications(newParams);
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
                  </div>
                  
                  {/* 使用时间筛选 */}
                  <div style={{ minWidth: '150px' }}>
                    <DatePicker
                      ref={datePickerRef}
                      style={{ width: '100%' }}
                      placeholder={t('applicationManagement.filters.datePlaceholder')}
                      format="YYYY-MM-DD"
                      value={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                        let newParams = { pageNum: 1 };
                        if (date) {
                          newParams = {
                            ...newParams,
                            queryDate: date.format('YYYY-MM-DD'),
                          };
                        } else {
                          newParams = {
                            ...newParams,
                            queryDate: undefined,
                          };
                        }
                        setSearchParams(prev => ({ ...prev, ...newParams }));
                        fetchApplications(newParams);
                      }}
                    />
                  </div>
                  
                  {/* 过期申请筛选 */}
                  <div className="filter-checkbox" style={{ minWidth: '120px', display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={showExpired}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setShowExpired(checked);
                        const newParams = { showExpired: checked, pageNum: 1 };
                        setSearchParams(prev => ({ ...prev, ...newParams }));
                        fetchApplications(newParams);
                      }}
                    >
                      {t('applicationManagement.filters.showExpired', '显示过期申请')}
                    </Checkbox>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      onClick={() => {
                        // 清空筛选控件内容
                        setSelectedRoom(undefined);
                        setSelectedDate(null);
                        setSelectedStatus(undefined);
                        setShowExpired(false);
                        // 清空搜索参数并刷新数据
                        const newParams = {
                          pageNum: 1,
                          roomId: undefined,
                          status: undefined,
                          queryDate: undefined,
                          showExpired: undefined
                        };
                        setSearchParams(newParams);
                        fetchApplications(newParams);
                      }}
                    >
                      {t('applicationManagement.filters.clearFilters', t('common.clearFilters'))}
                    </Button>
                  </div>
                </div>
              </FilterDropdownButton>
            )}
            <ResponsiveButton 
              icon={<ReloadOutlined />} 
              onClick={() => {
                // 清空筛选控件内容
                setSelectedRoom(undefined);
                setSelectedDate(null);
                setSelectedStatus(undefined);
                // 清空搜索参数并刷新数据
                const newParams = {
                  pageNum: 1,
                  roomId: undefined,
                  status: undefined,
                  queryDate: undefined
                };
                setSearchParams(prev => ({ ...prev, ...newParams }));
                fetchApplications(newParams);
              }}
              loading={applicationsLoading}
            >
              {t('common.refresh')}
            </ResponsiveButton>
            <ResponsiveButton type="primary" icon={<PlusOutlined />} onClick={handleAddApplication}>
              {t('common.apply')}
            </ResponsiveButton>
          </Space>
        }
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* 错误提示 */}
    {(applicationsError || roomsError) && (
          <Alert
      message={t('applicationManagement.error.dataFetchTitle')}
            description={String(applicationsError || roomsError)}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        
        {/* 筛选区域 */}
        <div style={{
          padding: isFilterCollapsed ? '4px' : '16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--component-bg)',
          transition: 'padding 0.3s ease'
        }}>
          <ResponsiveFilterContainer 
            threshold={1150}
            onCollapseStateChange={setIsFilterCollapsed}
          >
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {/* 教室筛选 */}
              <div style={{ minWidth: '200px' }}>
                <Select
                  placeholder={t('myApplications.filters.allRooms', '全部教室')}
                  allowClear
                  style={{ width: '100%' }}
                  value={selectedRoom}
                  onChange={(value) => {
                    setSelectedRoom(value);
                    const newParams = { roomId: value || undefined, pageNum: 1 };
                    setSearchParams(prev => ({ ...prev, ...newParams }));
                    fetchApplications(newParams);
                  }}
                >
                  {rooms.map(room => (
                    <Option key={room.id} value={room.id}>
                      {room.name} ({room.location})
                    </Option>
                  ))}
                </Select>
              </div>
              
              {/* 状态筛选 */}
              <div style={{ minWidth: '120px' }}>
                <Select
                  ref={statusSelectRef}
                  placeholder={t('applicationManagement.filters.statusPlaceholder')}
                  allowClear
                  style={{ width: '100%' }}
                  value={selectedStatus}
                  onChange={(value) => {
                    setSelectedStatus(value);
                    const newParams = { status: value || undefined, pageNum: 1 };
                    setSearchParams(prev => ({ ...prev, ...newParams }));
                    fetchApplications(newParams);
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
              </div>
              
              {/* 使用时间筛选 */}
              <div style={{ minWidth: '150px' }}>
                <DatePicker
                  ref={datePickerRef}
                  style={{ width: '100%' }}
                  placeholder={t('applicationManagement.filters.datePlaceholder')}
                  format="YYYY-MM-DD"
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    let newParams = { pageNum: 1 };
                    if (date) {
                      newParams = {
                        ...newParams,
                        queryDate: date.format('YYYY-MM-DD'),
                      };
                    } else {
                      newParams = {
                        ...newParams,
                        queryDate: undefined,
                      };
                    }
                    setSearchParams(prev => ({ ...prev, ...newParams }));
                    fetchApplications(newParams);
                  }}
                />
              </div>
              
              {/* 过期申请筛选 */}
              <div className="filter-checkbox" style={{ minWidth: '120px', display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={showExpired}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowExpired(checked);
                    const newParams = { showExpired: checked, pageNum: 1 };
                    setSearchParams(prev => ({ ...prev, ...newParams }));
                    fetchApplications(newParams);
                  }}
                >
                  {t('applicationManagement.filters.showExpired', '显示过期申请')}
                </Checkbox>
              </div>
              
              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  onClick={() => {
                    // 清空筛选控件内容
                    setSelectedRoom(undefined);
                    setSelectedDate(null);
                    setSelectedStatus(undefined);
                    setShowExpired(false);
                    // 清空搜索参数并刷新数据
                    const newParams = {
                      pageNum: 1,
                      roomId: undefined,
                      status: undefined,
                      queryDate: undefined,
                      showExpired: undefined
                    };
                    setSearchParams(newParams);
                    fetchApplications(newParams);
                  }}
                >
                  {t('applicationManagement.filters.clearFilters', t('common.clearFilters'))}
                </Button>
              </div>
            </div>
          </ResponsiveFilterContainer>
        </div>
        
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '0px solid var(--border-color)',
          borderRadius: '0px',
          overflow: 'hidden',
          height: '100%',
          position: 'relative'
        }}>
          
          {/* 表格内容区域 - 可滚动 */}
          <div style={{ 
            flex: 1,
            overflow: 'hidden'
          }}>
            <FixedTop>
              <div style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                height: '100%'
              }}>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    height: 8px;
                    background: transparent;
                  }
                  div::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  
                  /* 浅色模式 - 默认样式 */
                  div::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 4px;
                    transition: background 0.2s ease;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.25);
                  }
                  div {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
                  }
                  
                  /* 深色模式适配 - 半透明白色 */
                  [data-theme="dark"] div::-webkit-scrollbar-thumb,
                  .dark div::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                  }
                  [data-theme="dark"] div::-webkit-scrollbar-thumb:hover,
                  .dark div::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.35);
                  }
                  [data-theme="dark"] div,
                  .dark div {
                    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
                  }
                  
                  /* 系统深色模式 */
                  @media (prefers-color-scheme: dark) {
                    div::-webkit-scrollbar-thumb {
                      background: rgba(255, 255, 255, 0.2);
                    }
                    div::-webkit-scrollbar-thumb:hover {
                      background: rgba(255, 255, 255, 0.35);
                    }
                    div {
                      scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
                    }
                  }
                  
                  /* 明确的浅色模式覆盖（当明确指定浅色主题时） */
                  [data-theme="light"] div::-webkit-scrollbar-thumb,
                  .light div::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.15);
                  }
                  [data-theme="light"] div::-webkit-scrollbar-thumb:hover,
                  .light div::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.25);
                  }
                  [data-theme="light"] div,
                  .light div {
                    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
                  }
                `}</style>
                <Table
                  columns={columns}
                  dataSource={applications}
                  rowKey="id"
                  loading={applicationsLoading}
                  scroll={{ 
                    x: 1200, 
                    y: isFilterCollapsed ? 'calc(100vh - 251px)' : 'calc(100vh - 307px)',
                    scrollToFirstRowOnChange: false
                  }}
                  pagination={false}
                  onChange={handleTableChange}
                  size="middle"
                  style={{ height: '100%', minWidth: '1200px'}}
                  overflowX= 'hidden' 
                  sticky={{ offsetHeader: 0 }}
                  rowClassName={(record) => isApplicationExpired(record) ? 'expired-row' : ''}
                />
              </div>
            </FixedTop>
          </div>
          
          {/* 分页组件 - 常驻 */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--component-bg)',
            display: 'flex',
            justifyContent: 'center',
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px',
            fontFamily: 'var(--app-font-stack)'
          }}>
            <Pagination
              {...pagination}
              showSizeChanger={!isFilterCollapsed}
              showQuickJumper={!isFilterCollapsed}
              showTotal={(total, range) => {
                const tpl = t('applicationManagement.paginationTotal', t('roomList.paginationTotal'));
                return tpl.replace('{from}', range[0]).replace('{to}', range[1]).replace('{total}', total);
              }}
              pageSizeOptions={['10', '20', '50', '100']}
              size="default"
              onChange={(page, pageSize) => {
                const newParams = {
                  pageNum: page,
                  pageSize: pageSize,
                };
                setSearchParams(prev => ({ ...prev, ...newParams }));
                fetchApplications(newParams);
              }}
            />
          </div>
        </div>
      </Card>

      {/* 抽屉组件 */}
      <Drawer
        title={
          drawerType === 'detail' ? t('applicationManagement.drawer.detail') :
          drawerType === 'cancel' ? t('applicationManagement.drawer.cancel') : ''
        }
        width={600}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        footer={
          drawerType === 'cancel' ? (
            <div style={{ textAlign: 'right' }}>
              <Button onClick={handleCloseDrawer} style={{ marginRight: 8 }}>
                {t('applicationManagement.messages.cancelConfirmCancel')}
              </Button>
              <Button type="primary" danger onClick={() => form.submit()}>
                {t('applicationManagement.messages.cancelConfirmOk')}
              </Button>
            </div>
          ) : null
        }
      >
        {drawerType === 'detail' && currentApplication && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>{t('applicationManagement.descriptions.roomName')}：</strong>
              <span>{currentApplication.roomName}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>{t('applicationManagement.columns.usageTime')}：</strong>
              {(() => {
                const r = formatTimeRange(currentApplication.startTime, currentApplication.endTime, { structured: true });
                return r.crossDay ? (
                  <div className="num-mono" data-field="timeRange">
                    <div>{r.startFormatted} -</div>
                    <div>{r.endFormatted}</div>
                  </div>
                ) : (
                  <div className="num-mono" data-field="timeRange">{r.text}</div>
                );
              })()}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>{t('applicationManagement.columns.reason')}：</strong>
              <p>{currentApplication.reason}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>{t('applicationManagement.columns.status')}：</strong>
              {(() => {
                const isExpired = isApplicationExpired(currentApplication);
                
                if (isExpired) {
                  // 过期申请：显示原状态 + 过期标签
                  const originalStatus = currentApplication.originalStatus || currentApplication.status;
                  return (
                    <>
                      <Tag color={getApplicationStatusColor(originalStatus)}>
                        {getApplicationStatusDisplayName(originalStatus)}
                      </Tag>
                      <Tag color="default" style={{ marginLeft: 4 }}>
                        {t('applicationManagement.statusOptions.EXPIRED', '已过期')}
                      </Tag>
                    </>
                  );
                } else {
                  // 正常状态：仅显示当前状态
                  return (
                    <Tag color={getApplicationStatusColor(currentApplication.status)}>
                      {getApplicationStatusDisplayName(currentApplication.status)}
                    </Tag>
                  );
                }
              })()}
              {currentApplication.status === 'PENDING_CHECKIN' && currentApplication.userId === user?.id && (
                <Button 
                  type="primary" 
                  size="small" 
                  style={{ marginLeft: 8 }}
                  onClick={() => {
                    handleCheckinApplication(currentApplication);
                    handleCloseDrawer();
                  }}
                >{t('myApplications.actions.checkin', '签到')}</Button>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>{t('applicationManagement.descriptions.createTime', '申请时间')}：</strong>
              <span className="num-mono" data-field="createTime">{formatDateTime(currentApplication.createTime)}</span>
            </div>
            {currentApplication.crowd && (
              <div style={{ marginBottom: 16 }}>
                <strong>{t('myApplications.form.crowd', '使用人数')}：</strong>
                <span>{currentApplication.crowd}{t('myApplications.form.peopleUnit', '人')}</span>
              </div>
            )}
            {currentApplication.contact && (
              <div style={{ marginBottom: 16 }}>
                <strong>{t('myApplications.form.contact', '联系方式')}：</strong>
                <span>{currentApplication.contact}</span>
              </div>
            )}
            {currentApplication.remark && (
              <div style={{ marginBottom: 16 }}>
                <strong>{t('applicationManagement.descriptions.reason')}：</strong>
                <p>{currentApplication.remark}</p>
              </div>
            )}
          </div>
        )}

        {drawerType === 'cancel' && currentApplication && (
          <div>
            <div style={{ 
              marginBottom: 16, 
              padding: 16, 
              backgroundColor: 'var(--component-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: 6 
            }}>
              <h4 style={{ color: 'var(--text-color)', marginBottom: 12 }}>{t('applicationManagement.drawer.detail')}</h4>
              <div style={{ color: 'var(--text-color)' }}>
                <p><strong>{t('applicationManagement.descriptions.roomName')}：</strong>{currentApplication.roomName}</p>
                <p><strong>{t('applicationManagement.columns.usageTime')}：</strong>{formatTimeRange(currentApplication.startTime, currentApplication.endTime)}</p>
                <p><strong>{t('applicationManagement.columns.reason')}：</strong>{currentApplication.reason}</p>
                {currentApplication.crowd && (
                  <p><strong>{t('myApplications.form.crowd', '使用人数')}：</strong>{currentApplication.crowd}{t('myApplications.form.peopleUnit', '人')}</p>
                )}
                {currentApplication.contact && (
                  <p><strong>{t('myApplications.form.contact', '联系方式')}：</strong>{currentApplication.contact}</p>
                )}
              </div>
            </div>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              
              {currentApplication && (
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
                label={t('applicationManagement.form.cancelReason')}
                rules={[{ required: true, message: t('applicationManagement.form.enterCancelReason') }]}
              >
                <Input.TextArea rows={4} placeholder={t('applicationManagement.form.enterCancelReason')} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
    </PageErrorBoundary>
  );
}

// 导出的主组件，用 App 包装以提供 modal 上下文
export default function MyApplications() {
  return (
    <App>
      <MyApplicationsContent />
    </App>
  );
} 