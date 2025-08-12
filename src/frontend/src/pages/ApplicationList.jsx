import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Card, Button, Space, Drawer, Form, Input, DatePicker, Select, message, Alert, InputNumber, TimePicker, Tag, Pagination, Switch, Tooltip } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { applicationAPI } from '../api/application';
import { roomAPI } from '../api/room';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { getRoleDisplayName } from '../utils/roleMapping';
import { getApplicationStatusDisplayName, getApplicationStatusColor } from '../utils/statusMapping';
import { getRoomTypeDisplayName } from '../utils/roomMapping';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, formatTimeRange, formatRelativeTime } from '../utils/dateFormat';
import { formatDateTimeForBackend, validateTimeRange } from '../utils/dateUtils';
import { useDebounceSearchV2 } from '../hooks/useDebounceSearchV2';
import ResponsiveButton from '../components/ResponsiveButton';
import ResponsiveFilterContainer from '../components/ResponsiveFilterContainer';
import FilterDropdownButton from '../components/FilterDropdownButton';
import { useAuth } from '../contexts/AuthContext';
import FixedTop from '../components/FixedTop';
import dayjs from 'dayjs';
import { useI18n } from '../contexts/I18nContext';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ApplicationList() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [applications, setApplications] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showOnlyMyApplications, setShowOnlyMyApplications] = useState(false);
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
  const datePickerRef = useRef(null);
  const statusSelectRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);


  
  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'add', 'detail', 'approve'
  const [currentApplication, setCurrentApplication] = useState(null);
  
  const { loading: applicationsLoading, error: applicationsError, executeWithRetry: executeApplications } = useApiWithRetry();
  const { loading: roomsLoading, error: roomsError, executeWithRetry: executeRooms } = useApiWithRetry();
  
  // 页面刷新Hook
  const handlePageRefresh = usePageRefresh(() => {
    fetchApplications();
    fetchRooms();
  });
  
  // 防抖搜索Hook
  const roomSearch = useDebounceSearchV2((value) => {
    const newParams = { roomName: value || undefined, pageNum: 1 };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchApplications(newParams);
  }, 500);
  
  const applicantSearch = useDebounceSearchV2((value) => {
    const newParams = { nickname: value || undefined, pageNum: 1 };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    fetchApplications(newParams);
  }, 500);

  // 获取申请列表
  const fetchApplications = useCallback(async (params = {}) => {
    const result = await executeApplications(
      async () => {
        // 获取当前的searchParams，避免闭包问题
        const currentSearchParams = searchParams;
        const requestParams = {
          ...currentSearchParams,
          ...params,
        };
        
        // 如果勾选了"仅查看自己的申请"，添加用户ID筛选
        if (showOnlyMyApplications && user?.id) {
          requestParams.userId = user.id;
          // 清空申请人搜索，因为只查看自己的申请
          requestParams.nickname = undefined;
        } else {
          // 如果没有勾选"仅查看自己的申请"，移除用户ID筛选
          requestParams.userId = undefined;
          requestParams.nickname = undefined;
        }
        
        console.log('发送申请分页请求参数:', requestParams);
        const response = await applicationAPI.getApplicationList(requestParams);
        
        const { records, total, pageNum, pageSize } = response.data;
        console.log('申请分页响应数据:', response.data);
        
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
        maxRetries: 0, // 不重试，避免反复请求
        retryDelay: 0
      }
    );
    return result;
  }, [executeApplications, searchParams, user?.id]); // 移除showOnlyMyApplications依赖

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
        maxRetries: 0, // 不重试，避免反复请求
        retryDelay: 0,
        showRetryMessage: false
      }
    );
    return result;
  }, [executeRooms]);

  // 初始化加载
  useEffect(() => {
    fetchApplications();
    fetchRooms();
  }, [fetchApplications, fetchRooms]); // 修复依赖

  // 处理表格分页变化
  const handleTableChange = (pagination, filters, sorter) => {
    console.log('申请表格分页变化:', pagination);
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

  // 打开审批抽屉
  const handleApprove = (record) => {
    setDrawerType('approve');
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
      if (drawerType === 'add') {
        // 处理时间范围
        const [startTime, endTime] = values.timeRange;
        
        const validation = validateTimeRange(startTime, endTime);
        if (!validation.valid) {
          messageApi.error(validation.message);
          return;
        }
        
        const applicationData = {
          roomId: values.room,
          startTime: formatDateTimeForBackend(startTime),
          endTime: formatDateTimeForBackend(endTime),
          reason: values.reason,
          crowd: values.crowd,
          contact: values.contact,
        };
        
        await executeApplications(
          async () => {
            const response = await applicationAPI.createApplication(applicationData);
            messageApi.success(t('applicationManagement.messages.approveSuccess', t('common.submit')));
            handleCloseDrawer();
            fetchApplications(); // 刷新列表
            return response;
          },
          {
            errorMessage: t('applicationManagement.messages.approveFail'),
            successMessage: t('applicationManagement.messages.approveSuccess')
          }
        );
      } else if (drawerType === 'approve') {
        await executeApplications(
          async () => {
            const response = await applicationAPI.approveApplication({
              applicationId: currentApplication.id,
              approved: values.approved,
              reason: values.reason
            });
            messageApi.success(values.approved ? t('applicationManagement.messages.approveApproved') : t('applicationManagement.messages.approveRejected'));
            handleCloseDrawer();
            fetchApplications(); // 刷新列表
            return response;
          },
          {
            errorMessage: t('applicationManagement.messages.approveFail'),
            successMessage: t('applicationManagement.messages.approveSuccess')
          }
        );
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  const columns = [
    {
  title: t('applicationManagement.columns.roomName'),
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
  title: t('applicationManagement.columns.applicant'),
      dataIndex: 'userNickname',
      key: 'userNickname',
    },
    {
  title: t('applicationManagement.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const displayName = getApplicationStatusDisplayName(status);
        const color = getApplicationStatusColor(status);
        
        // 如果是过期状态，显示原状态和过期标签
        if (status === 'EXPIRED' && record.originalStatus) {
          const originalDisplayName = getApplicationStatusDisplayName(record.originalStatus);
          const originalColor = getApplicationStatusColor(record.originalStatus);
          return (
            <div>
              <Tag color={originalColor}>{originalDisplayName}</Tag>
              <Tag color="default" style={{ marginTop: 2 }}>{displayName}</Tag>
            </div>
          );
        }
        
        return <Tag color={color}>{displayName}</Tag>;
      },
    },
    {
  title: t('applicationManagement.columns.usageTime'),
      key: 'time',
      onCell: () => ({ 'data-field': 'timeRange' }),
      render: (_, record) => {
        const r = formatTimeRange(record.startTime, record.endTime, { structured: true });
        if (r && r.crossDay) {
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
          {record.status === 'PENDING' && (
            <Tooltip title={t('applicationManagement.tooltips.approve')}>
              <Button 
                type="text" 
                icon={<CheckOutlined />} 
                size="small" 
                style={{ color: '#52c41a' }}
                onClick={() => handleApprove(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{t('applicationManagement.title')}</span>
            {/* 只受宽度影响，600px 及以上显示提示，与按钮逻辑一致 */}
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
                  {/* 教室搜索 */}
                  <div style={{ minWidth: '200px' }}>
                    <Input
                      placeholder={t('applicationManagement.filters.roomSearchPlaceholder')}
                      allowClear
                      style={{ width: '100%' }}
                      value={roomSearch.searchValue}
                      onChange={(e) => roomSearch.updateSearchValue(e.target.value)}
                      onPressEnter={() => roomSearch.searchImmediately(roomSearch.searchValue)}
                    />
                  </div>
                  
                  {/* 申请人搜索 */}
                  <div style={{ minWidth: '150px' }}>
                    <Input
                      placeholder={t('applicationManagement.filters.applicantSearchPlaceholder')}
                      allowClear
                      style={{ 
                        width: '100%',
                        ...(showOnlyMyApplications && {
                          backgroundColor: 'var(--disabled-bg)',
                          color: 'var(--text-color-disabled)',
                          cursor: 'not-allowed',
                          opacity: 0.6
                        })
                      }}
                      value={applicantSearch.searchValue}
                      onChange={(e) => applicantSearch.updateSearchValue(e.target.value)}
                      onPressEnter={() => applicantSearch.searchImmediately(applicantSearch.searchValue)}
                      disabled={showOnlyMyApplications}
                    />
                  </div>
                  
                  {/* 仅查看自己的申请 */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '150px',
                    gap: '8px',
                    height: '32px'
                  }}>
                    <Switch
                      checked={showOnlyMyApplications}
                      onChange={(checked) => {
                        // 如果勾选了"仅查看自己的申请"，清空申请人搜索
                        if (checked) {
                          // 直接设置搜索值，避免触发防抖搜索
                          applicantSearch.updateSearchValue('');
                        }
                        
                        // 构建新的搜索参数
                        const newParams = {
                          pageNum: 1,
                          roomName: roomSearch.searchValue || undefined,
                          nickname: checked ? undefined : (applicantSearch.searchValue || undefined),
                          status: selectedStatus,
                          queryDate: selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined,
                          userId: checked ? user?.id : undefined
                        };
                        
                        // 先更新搜索参数
                        setSearchParams(newParams);
                        
                        // 更新状态
                        setShowOnlyMyApplications(checked);
                        
                        
                      }}
                      size="small"
                    />
                    <span style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-color)',
                      lineHeight: '32px'
                    }}>
                      {t('myApplications.filters.onlyMine', '仅查看自己的申请')}
                    </span>
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
                      <Option value="APPROVED">{t('applicationManagement.statusOptions.APPROVED')}</Option>
                      <Option value="REJECTED">{t('applicationManagement.statusOptions.REJECTED')}</Option>
                      <Option value="CANCELLED">{t('applicationManagement.statusOptions.CANCELLED')}</Option>
                      <Option value="COMPLETED">{t('applicationManagement.statusOptions.COMPLETED')}</Option>
                      <Option value="EXPIRED">{t('applicationManagement.statusOptions.EXPIRED')}</Option>
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
                          // 将dayjs对象转换为YYYY-MM-DD格式的字符串
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
                  
                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      onClick={() => {
                        // 清空筛选控件内容
                        roomSearch.updateSearchValue('');
                        applicantSearch.updateSearchValue('');
                        // 清除日期选择器
                        setSelectedDate(null);
                        // 清空状态选择器
                        setSelectedStatus(undefined);
                        // 清空"仅查看自己的申请"复选框
                        setShowOnlyMyApplications(false);
                        // 清空搜索参数并刷新数据
                        const newParams = {
                          pageNum: 1,
                          roomName: undefined,
                          nickname: undefined,
                          status: undefined,
                          queryDate: undefined,
                          userId: undefined
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
                roomSearch.updateSearchValue('');
                applicantSearch.updateSearchValue('');
                // 清除日期选择器
                setSelectedDate(null);
                // 清空状态选择器
                setSelectedStatus(undefined);
                // 清空搜索参数并刷新数据
                const newParams = {
                  pageNum: 1,
                  roomName: undefined,
                  nickname: undefined,
                  status: undefined,
                  queryDate: undefined
                };
                setSearchParams(newParams);
                fetchApplications(newParams);
              }}
              loading={applicationsLoading}
            >
              {t('common.refresh')}
            </ResponsiveButton>
            <ResponsiveButton type="primary" icon={<PlusOutlined />} onClick={handleAddApplication}>
              {t('common.create')}
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
            threshold={900}
            onCollapseStateChange={setIsFilterCollapsed}
          >
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {/* 教室搜索 */}
              <div style={{ minWidth: '200px' }}>
                <Input
                  placeholder={t('applicationManagement.filters.roomSearchPlaceholder')}
                  allowClear
                  style={{ width: '100%' }}
                  value={roomSearch.searchValue}
                  onChange={(e) => roomSearch.updateSearchValue(e.target.value)}
                  onPressEnter={() => roomSearch.searchImmediately(roomSearch.searchValue)}
                />
              </div>
              
              {/* 申请人搜索 */}
              <div style={{ minWidth: '150px' }}>
                <Input
                  placeholder={t('applicationManagement.filters.applicantSearchPlaceholder')}
                  allowClear
                  style={{ 
                    width: '100%',
                    ...(showOnlyMyApplications && {
                      backgroundColor: 'var(--disabled-bg)',
                      color: 'var(--text-color-disabled)',
                      cursor: 'not-allowed',
                      opacity: 0.6
                    })
                  }}
                  value={applicantSearch.searchValue}
                  onChange={(e) => applicantSearch.updateSearchValue(e.target.value)}
                  onPressEnter={() => applicantSearch.searchImmediately(applicantSearch.searchValue)}
                  disabled={showOnlyMyApplications}
                />
              </div>
              
                          {/* 仅查看自己的申请 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '150px',
                gap: '8px',
                height: '32px'
              }}>
                <Switch
                  checked={showOnlyMyApplications}
                  onChange={(checked) => {
                    // 如果勾选了"仅查看自己的申请"，清空申请人搜索
                    if (checked) {
                      // 直接设置搜索值，避免触发防抖搜索
                      applicantSearch.updateSearchValue('');
                    }
                    
                    // 构建新的搜索参数
                    const newParams = {
                      pageNum: 1,
                      roomName: roomSearch.searchValue || undefined,
                      nickname: checked ? undefined : (applicantSearch.searchValue || undefined),
                      status: selectedStatus,
                      queryDate: selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined,
                      userId: checked ? user?.id : undefined
                    };
                    
                    // 先更新搜索参数
                    setSearchParams(newParams);
                    
                    // 更新状态
                    setShowOnlyMyApplications(checked);
                    
                    
                  }}
                  size="small"
                />
                <span style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-color)',
                  lineHeight: '32px'
                }}>
                  {t('myApplications.filters.onlyMine', '仅查看自己的申请')}
                </span>
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
                  <Option value="APPROVED">{t('applicationManagement.statusOptions.APPROVED')}</Option>
                  <Option value="REJECTED">{t('applicationManagement.statusOptions.REJECTED')}</Option>
                  <Option value="CANCELLED">{t('applicationManagement.statusOptions.CANCELLED')}</Option>
                  <Option value="COMPLETED">{t('applicationManagement.statusOptions.COMPLETED')}</Option>
                  <Option value="EXPIRED">{t('applicationManagement.statusOptions.EXPIRED')}</Option>
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
                      // 将dayjs对象转换为YYYY-MM-DD格式的字符串
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
              

              
              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                onClick={() => {
                  // 清空筛选控件内容
                  roomSearch.updateSearchValue('');
                  applicantSearch.updateSearchValue('');
                  // 清除日期选择器
                  setSelectedDate(null);
                  // 清空状态选择器
                  setSelectedStatus(undefined);
                  // 清空"仅查看自己的申请"复选框
                  setShowOnlyMyApplications(false);
                  // 清空搜索参数并刷新数据
                  const newParams = {
                    pageNum: 1,
                    roomName: undefined,
                    nickname: undefined,
                    status: undefined,
                    queryDate: undefined,
                    userId: undefined
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
                <Table
                  columns={columns}
                  dataSource={applications}
                  rowKey="id"
                  loading={applicationsLoading}
                  scroll={{ x: 1200, y: undefined, scrollToFirstRowOnChange: false }}
                  pagination={false}
                  onChange={handleTableChange}
                  size="middle"
                  style={{ height: '100%', minWidth: '1200px', overflowX: 'hidden' }}
                  sticky={{ offsetHeader: 0 }}
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
            justifyContent: 'center'
          }}>
            <Pagination
              {...pagination}
              showSizeChanger={true}
              showQuickJumper={true}
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
          drawerType === 'add' ? t('applicationManagement.drawer.add', t('applicationManagement.drawer.detail')) :
          drawerType === 'detail' ? t('applicationManagement.drawer.detail') :
          drawerType === 'approve' ? t('applicationManagement.drawer.approve') : ''
        }
        width={600}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        footer={
          drawerType !== 'detail' ? (
            <div style={{ textAlign: 'right' }}>
              <Button onClick={handleCloseDrawer} style={{ marginRight: 8 }}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" onClick={() => form.submit()}>
                {drawerType === 'add' ? t('applicationManagement.actions.submit', t('common.submit')) : t('applicationManagement.actions.confirm', t('common.confirm'))}
              </Button>
            </div>
          ) : null
        }
      >
        {drawerType === 'add' && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="room"
              label={t('applicationManagement.descriptions.roomName')}
              rules={[{ required: true, message: t('applicationManagement.form.enterApproveOpinion', '请选择教室') }]}
            >
              <Select placeholder={t('applicationManagement.form.selectRoom', '请选择教室')}>
                {rooms.map(room => (
                  <Option key={room.id} value={room.id}>
                    {room.name} ({room.location}) - {getRoomTypeDisplayName(room.type)}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="timeRange"
              label={t('applicationManagement.columns.usageTime')}
              rules={[{ required: true, message: t('applicationManagement.form.selectTime', '请选择使用时间') }]}
            >
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
                placeholder={[
                  t('applicationManagement.form.timeRangePlaceholder.0', '开始时间'),
                  t('applicationManagement.form.timeRangePlaceholder.1', '结束时间')
                ]}
                disabledDate={(current) => {
                  return current && current < dayjs().startOf('day');
                }}
                disabledTime={(date, type) => {
                  if (type === 'start') {
                    return {
                      disabledHours: () => [],
                      disabledMinutes: () => [],
                      disabledSeconds: () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
                    };
                  }
                  return {
                    disabledHours: () => [],
                    disabledMinutes: () => [],
                    disabledSeconds: () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
                  };
                }}
                minuteStep={15}
              />
            </Form.Item>

            <Form.Item
              name="reason"
              label={t('applicationManagement.columns.reason')}
              rules={[{ required: true, message: t('applicationManagement.form.enterCancelReason', '请输入使用原因') }]}
            >
              <Input.TextArea rows={3} placeholder={t('applicationManagement.form.enterCancelReason', '请详细描述使用原因')} />
            </Form.Item>

            <Form.Item
              name="crowd"
              label={t('myApplications.form.crowd', '使用人数')}
              rules={[{ required: true, message: t('myApplications.form.enterCrowd', '请输入使用人数') }]}
            >
              <InputNumber
                min={1}
                max={1000}
                placeholder={t('myApplications.form.enterCrowd', '请输入使用人数')}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="contact"
              label={t('myApplications.form.contact', '联系方式')}
              rules={[{ required: true, message: t('myApplications.form.enterContact', '请输入联系方式') }]}
            >
              <Input placeholder={t('myApplications.form.enterContact', '请输入联系方式')} />
            </Form.Item>

            <Form.Item
              name="remark"
              label={t('applicationManagement.descriptions.reason')}
            >
              <Input.TextArea rows={3} placeholder={t('applicationManagement.form.enterApproveOpinion', '请输入备注信息')} />
            </Form.Item>
          </Form>
        )}

        {drawerType === 'detail' && currentApplication && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>申请教室：</strong>
              <span>{currentApplication.roomName}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>申请人：</strong>
              <span>{currentApplication.userNickname || currentApplication.username}</span>
              {currentApplication.userRole && (
                <Tag color="processing" style={{ marginLeft: '8px' }}>
                  {getRoleDisplayName(currentApplication.userRole)}
                </Tag>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>使用时间：</strong>
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
              <strong>使用原因：</strong>
              <p>{currentApplication.reason}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>状态：</strong>
              <Tag color={getApplicationStatusColor(currentApplication.status)}>
                {getApplicationStatusDisplayName(currentApplication.status)}
              </Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>申请时间：</strong>
              <span className="num-mono" data-field="createTime">{formatDateTime(currentApplication.createTime)}</span>
            </div>
            {currentApplication.crowd && (
              <div style={{ marginBottom: 16 }}>
                <strong>使用人数：</strong>
                <span className="num-mono" data-field="crowd">{currentApplication.crowd}人</span>
              </div>
            )}
            {currentApplication.contact && (
              <div style={{ marginBottom: 16 }}>
                <strong>联系方式：</strong>
                <span>{currentApplication.contact}</span>
              </div>
            )}
            {currentApplication.remark && (
              <div style={{ marginBottom: 16 }}>
                <strong>备注：</strong>
                <p>{currentApplication.remark}</p>
              </div>
            )}
          </div>
        )}

        {drawerType === 'approve' && currentApplication && (
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
                <p><strong>{t('applicationManagement.descriptions.applicant')}：</strong>{currentApplication.userNickname || currentApplication.username}
                  {currentApplication.userRole && (
                    <Tag color="processing" style={{ marginLeft: '8px' }}>
                      {getRoleDisplayName(currentApplication.userRole)}
                    </Tag>
                  )}
                </p>
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
              
              <Form.Item
                name="reason"
                label={t('applicationManagement.form.approveOpinion')}
                rules={[{ required: true, message: t('applicationManagement.form.enterApproveOpinion') }]}
              >
                <Input.TextArea rows={4} placeholder={t('applicationManagement.form.enterApproveOpinion')} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
    </PageErrorBoundary>
  );
} 