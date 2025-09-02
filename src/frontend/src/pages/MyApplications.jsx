import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Table, Card, Button, Space, Drawer, Form, Input, DatePicker, Select, Alert, Tag, Pagination, Checkbox, Tooltip, App, message } from 'antd';
import { EyeOutlined, PlusOutlined, ReloadOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { applicationAPI } from '../api/application';
import { roomAPI } from '../api/room';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { getApplicationStatusDisplayName, getApplicationStatusColor, isApplicationExpired } from '../utils/statusMapping';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, formatTimeRange } from '../utils/dateFormat';
import { useAuth } from '../contexts/AuthContext';
import FixedTop from '../components/FixedTop';
import ResponsiveButton from '../components/ResponsiveButton';
import ResponsiveFilterContainer from '../components/ResponsiveFilterContainer';
import FilterDropdownButton from '../components/FilterDropdownButton';
import ManagementPageContainer from '../components/ManagementPageContainer';
import { useI18n } from '../contexts/I18nContext';
import { BlurContext } from '../App';

const { Option } = Select;

// 主要组件内容
function MyApplicationsContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { modal } = App.useApp();
  const [applications, setApplications] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
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
  const [roomSearchText, setRoomSearchText] = useState('');
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
  const { /*loading: roomsLoading,*/ error: roomsError, executeWithRetry: executeRooms } = useApiWithRetry();
  
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
  }, [executeApplications,searchParams,t, user?.id]);

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
  }, [executeRooms,t]);

  // 初始化加载
  useEffect(() => {
    if (user?.id) {
      fetchApplications();
      fetchRooms();
    }
  }, [user?.id, fetchApplications, fetchRooms]); // 依赖用户ID

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
  // 1. filterControls（主筛选区控件）
  const filterControls = [
                  <div style={{ minWidth: '200px' }} key="room">
                    <Input
                      placeholder={t('myApplications.filters.roomSearchPlaceholder', '搜索教室名称')}
                      allowClear
                      style={{ width: '100%' }}
                      value={roomSearchText}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRoomSearchText(value);
                        const newParams = { roomName: value || undefined, pageNum: 1 };
                        setSearchParams(prev => ({ ...prev, ...newParams }));
                        fetchApplications(newParams);
                      }}
                      onPressEnter={(e) => {
                        const value = e.target.value;
                        const newParams = { roomName: value || undefined, pageNum: 1 };
                        setSearchParams(prev => ({ ...prev, ...newParams }));
                        fetchApplications(newParams);
                      }}
                    />
                  </div>,

                  <div style={{ minWidth: '120px' }} key="status">
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
                  </div>,
                  <div style={{ minWidth: '150px' }} key="date">
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
                  </div>,
                  <div className="filter-checkbox" style={{ minWidth: '120px', display: 'flex', alignItems: 'center' }} key="expired">
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
                  </div>,
                  <div className="filter-clear" style={{ minWidth: '120px', display: 'flex', alignItems: 'center' }} key="clear">
                        <Button
                            key="clear"
                            style={{ marginLeft: 8 }}
                            onClick={() => {
                            // 清空筛选控件内容
                            setSelectedRoom(undefined);
                            setRoomSearchText('');
                            setSelectedDate(null);
                            setSelectedStatus(undefined);
                            setShowExpired(false);
                           // 清空搜索参数并刷新数据
                           const newParams = {
                             pageNum: 1,
                             roomId: undefined,
                             roomName: undefined,
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
                      </div>,
  ];

  

  // 2. actions（常规操作按钮）
  const actions = [
    <ResponsiveButton 
              icon={<ReloadOutlined />} 
              onClick={() => {
                // 清空筛选控件内容
                setSelectedRoom(undefined);
                setRoomSearchText('');
                setSelectedDate(null);
                setSelectedStatus(undefined);
                // 清空搜索参数并刷新数据
                const newParams = {
                  pageNum: 1,
                  roomId: undefined,
                  roomName: undefined,
                  status: undefined,
                  queryDate: undefined
                };
                setSearchParams(prev => ({ ...prev, ...newParams }));
                fetchApplications(newParams);
              }}
              loading={applicationsLoading}
            >
              {t('common.refresh')}
            </ResponsiveButton>,
            <ResponsiveButton type="primary" icon={<PlusOutlined />} onClick={handleAddApplication}>
              {t('common.apply')}
            </ResponsiveButton>
  ];

  // 3. tableProps
  const tableProps = {
    columns,
    dataSource: applications,
    rowKey: 'id',
    loading: applicationsLoading,
    onChange: handleTableChange,
    rowClassName: record => isApplicationExpired(record) ? 'expired-row' : ''
  };

  // 4. pageProps
  const pageProps = {
    ...pagination,
    showTotal: (total, range) => {
      const tpl = t('applicationManagement.paginationTotal', t('roomList.paginationTotal'));
      return tpl.replace('{from}', range[0]).replace('{to}', range[1]).replace('{total}', total);
    },
    onChange: (page, pageSize) => {
      const newParams = { pageNum: page, pageSize };
      setSearchParams(prev => ({ ...prev, ...newParams }));
      fetchApplications(newParams);
    }
  };

  // 5. 错误提示
  const error = applicationsError && {
    title: t('applicationManagement.error.dataFetchTitle'),
    description: String(applicationsError || roomsError)
  };

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}
      <ManagementPageContainer
        title={t('myApplications.title')}
        badge={<div style={{fontWeight: 'normal', fontVariationSettings:"'wght' 400"}}>{t('applicationManagement.badgeRetention')}</div>}
        actions={actions}
        filterControls={filterControls}
        filterCollapsed={isFilterCollapsed}
        onFilterCollapseChange={setIsFilterCollapsed}
        tableProps={tableProps}
        pageProps={pageProps}
        error={error}
      />
      {/* Drawer/Modal等业务弹窗保留 */}
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