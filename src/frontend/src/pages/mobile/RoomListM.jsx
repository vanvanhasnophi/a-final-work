import '../../styles/modal-btn-row.css';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  List, Button, Form, Input, Select, message, Tag, Result, Drawer,
  Descriptions, Divider, App, InputNumber, DatePicker, Modal
} from 'antd';
import {
  EyeOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined,
  SearchOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApiWithRetry } from '../../hooks/useApiWithRetry';
import { usePageRefresh } from '../../hooks/usePageRefresh';
import PageErrorBoundary from '../../components/PageErrorBoundary';
import ManagementPageContainerM from '../../components/ManagementPageContainerM';

import { roomAPI } from '../../api/room';
import { applicationAPI } from '../../api/application';
import { formatTimeRange, formatDateTime } from '../../utils/dateFormat';
import { getRoomTypeDisplayName, getRoomTypeEnumValue, getRoomTypeFrontendValue, roomTypeOptions } from '../../utils/roomMapping';
import { getRoomStatusDisplayName, getRoomStatusColor, roomStatusOptions } from '../../utils/roomStatusMapping';
import { formatDateTimeForBackend, validateTimeRange } from '../../utils/dateUtils';
import { useTimeConflictCheck } from '../../hooks/useTimeConflictCheck';
import { useI18n } from '../../contexts/I18nContext';
import { canCreateRoom, canDeleteRoom, canUpdateRoom, canCreateApplication } from '../../utils/permissionUtils';
import ResponsiveButton from '../../components/ResponsiveButton';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

// 主要组件内容
function RoomListContent({ setFloatContent }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { modal } = App.useApp();
  const navigate = useNavigate();

  // 状态映射函数（与桌面端保持一致）
  const getStatusEnumValue = (frontendValue) => {
    const statusMapping = {
      'available': 'AVAILABLE',
      'occupied': 'USING',
      'reserved': 'RESERVED',
      'using': 'USING',
      'maintenance': 'MAINTENANCE',
      'cleaning': 'CLEANING',
      'pending_cleaning': 'PENDING_CLEANING',
      'pending_maintenance': 'PENDING_MAINTENANCE',
      'unavailable': 'UNAVAILABLE'
    };
    return statusMapping[frontendValue] || frontendValue;
  };

  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useState({
    pageNum: 1,
    pageSize: 20,
  });
  const [messageApi, contextHolder] = message.useMessage();

  // 筛选控件状态
  const [selectedType, setSelectedType] = useState(undefined);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  // 筛选状态管理
  const [isFiltering, setIsFiltering] = useState(false);
  const [inputResetKey, setInputResetKey] = useState(0);
  const [selectKey, setSelectKey] = useState(0);
  const [floatKey, setFloatKey] = useState(0);

  // 添加 ref 来直接访问输入框的值
  const roomInputRef = useRef(null);

  // 添加状态的 ref 来避免状态更新延迟
  const selectedTypeRef = useRef(selectedType);
  const selectedStatusRef = useRef(selectedStatus);

  // 保持 ref 与 state 同步
  useEffect(() => {
    selectedTypeRef.current = selectedType;
  }, [selectedType]);

  useEffect(() => {
    selectedStatusRef.current = selectedStatus;
  }, [selectedStatus]);

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'add', 'detail', 'apply', 'edit'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [futureApplications, setFutureApplications] = useState([]);

  // 表单相关
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // 删除相关状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteRoomRecord, setDeleteRoomRecord] = useState(null);

  // API 调用相关
  const { loading: roomsLoading, error: roomsError, executeWithRetry: executeRooms } = useApiWithRetry();
  const { loading: applicationLoading, error: applicationError, executeWithRetry: executeApplication } = useApiWithRetry();
  const { checkTimeConflict, hasConflict, conflictMessage, clearConflict, loading: conflictLoading } = useTimeConflictCheck(
    currentRoom?.id
  );

  // 获取教室列表
  const fetchRooms = useCallback(async (params = {}, append = false) => {
    const result = await executeRooms(
      async () => {
        const currentSearchParams = searchParams;
        const requestParams = {
          ...currentSearchParams,
          ...params,
        };

        console.log('发送教室分页请求参数:', requestParams);
        const response = await roomAPI.getRoomList(requestParams);

        const { records, total: totalCount } = response.data;
        console.log('教室分页响应数据:', response.data);

        const finalRecords = Array.isArray(records) ? records : [];
        const finalTotal = (typeof totalCount === 'number' && totalCount >= 0) ? totalCount : 0;

        if (append) {
          setRooms(prev => [...prev, ...finalRecords]);
        } else {
          setRooms(finalRecords);
        }
        setTotal(finalTotal);
        setFloatKey(k => k + 1);

        return response.data;
      },
      {
        errorMessage: t('roomList.error.fetchListFail'),
        maxRetries: 0,
        retryDelay: 0,
      }
    );
    return result;
  }, [executeRooms, searchParams, t]);

  // 初始化加载
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // 页面刷新Hook
  const handlePageRefresh = usePageRefresh(() => {
    fetchRooms();
  });

  // 使用 ref 值的即时搜索函数
  const handleSearchWithRef = useCallback(() => {
    // 从 ref 直接获取搜索框的当前值，并进行安全性验证
    const roomValue = (roomInputRef.current?.input?.value || '').substring(0, 100);

    // 基本的输入清理，防止潜在的安全问题
    const cleanRoomName = roomValue.replace(/[<>\"'&]/g, '').trim();

    // 使用 ref 中的最新值
    const currentType = selectedTypeRef.current;
    const currentStatus = selectedStatusRef.current;

    const newParams = {
      name: cleanRoomName || undefined,
      type: currentType ? getRoomTypeEnumValue(currentType) : undefined,
      status: currentStatus ? getStatusEnumValue(currentStatus) : undefined,
      pageNum: 1
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    setRooms([]);
    setTotal(0);
    fetchRooms(newParams, false);

    // 更新筛选状态
    const hasFilters = cleanRoomName || currentType || currentStatus;
    setIsFiltering(!!hasFilters);

    // 如果有筛选条件，保持筛选器展开状态以便用户查看/修改条件
    if (hasFilters && isFilterCollapsed) {
      setIsFilterCollapsed(false);
    }

    setFloatKey(k => k + 1); // 确保筛选按钮颜色立即更新
  }, [fetchRooms, isFilterCollapsed]);

  // 手动搜索函数
  const handleSearch = useCallback(() => {
    // 从 ref 直接获取搜索框的当前值，并进行安全性验证
    const roomValue = (roomInputRef.current?.input?.value || '').substring(0, 100);

    // 基本的输入清理，防止潜在的安全问题
    const cleanRoomName = roomValue.replace(/[<>\"'&]/g, '').trim();

    const newParams = {
      name: cleanRoomName || undefined,
      type: selectedType ? getRoomTypeEnumValue(selectedType) : undefined,
      status: selectedStatus ? getStatusEnumValue(selectedStatus) : undefined,
      pageNum: 1
    };
    setSearchParams(prev => ({ ...prev, ...newParams }));
    setRooms([]);
    setTotal(0);
    fetchRooms(newParams, false);

    // 更新筛选状态
    const hasFilters = cleanRoomName || selectedType || selectedStatus;
    setIsFiltering(!!hasFilters);

    // 如果有筛选条件，保持筛选器展开状态以便用户查看/修改条件
    if (hasFilters && isFilterCollapsed) {
      setIsFilterCollapsed(false);
    }

    setFloatKey(k => k + 1); // 确保筛选按钮颜色立即更新
  }, [selectedType, selectedStatus, fetchRooms, isFilterCollapsed]);
  // 添加教室函数
  const handleAddRoom = useCallback(() => {
    setCurrentRoom(null);
    setDrawerType('add');
    setDrawerVisible(true);
  }, []);

  // 编辑教室函数
  const handleEditRoom = useCallback((room) => {
    setCurrentRoom(room);
    setDrawerType('edit');
    setDrawerVisible(true);
  }, []);

  // 删除教室函数（使用 Modal.confirm）
  const handleDeleteRoom = useCallback((room) => {
    // 检查教室状态
    if (room.status === 'OCCUPIED') {
      messageApi.warning(t('roomList.deleteInUseWarning', '教室正在使用中，无法删除。'));
      return;
    }

    // 设置删除记录并显示确认对话框
    setDeleteRoomRecord(room);
    setDeleteModalVisible(true);
  }, [messageApi, t]);

  // 执行删除教室
  const executeDeleteRoom = useCallback(async () => {
    if (!deleteRoomRecord) return;

    try {
      await executeRooms(
        async () => {
          await roomAPI.deleteRoom(deleteRoomRecord.id);
          messageApi.success(t('roomList.messages.deleteSuccess', '教室删除成功'));
          // 刷新列表
          fetchRooms();
        },
        {
          errorMessage: t('roomList.messages.deleteFail', '删除教室失败'),
          maxRetries: 3,
          retryDelay: 1000,
        }
      );
    } catch (error) {
      console.error('删除教室失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '未知错误';

      // 根据错误类型显示不同的提示
      if (errorMessage.includes('相关申请记录')) {
        messageApi.error(t('roomList.errors.delete.relatedApplications', '删除失败：该教室存在相关申请记录。'));
      } else if (errorMessage.includes('正在使用中')) {
        messageApi.error(t('roomList.errors.delete.inUse', '删除失败：教室正在使用中。'));
      } else {
        messageApi.error(t('roomList.errors.delete.unknownPrefix', '删除教室失败: ') + errorMessage);
      }
    } finally {
      setDeleteModalVisible(false);
      setDeleteRoomRecord(null);
    }
  }, [deleteRoomRecord, executeRooms, messageApi, t, fetchRooms]);

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

  // List项内容渲染函数
  const listItemBody = useCallback((item) => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
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
            {item.name}
          </div>
          <div style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}>
            <Tag color={getRoomStatusColor(item.status)}>
              {getRoomStatusDisplayName(item.status)}
            </Tag>
          </div>
        </div>

        {/* 教室类型 */}
        <div style={{
          fontSize: '14px',
          color: 'var(--text-color-secondary)',
          lineHeight: '1.4'
        }}>
          <span>{t('roomList.labels.type', '类型')}：</span>
          <span>{getRoomTypeDisplayName(item.type)}</span>
        </div>

        {/* 容量信息 */}
        <div style={{
          fontSize: '14px',
          color: 'var(--text-color-secondary)',
          lineHeight: '1.4'
        }}>
          <span>{t('roomList.labels.capacity', '容量')}：</span>
          <span>{item.capacity}人</span>
        </div>

        {/* 位置信息 */}
        {item.location && (
          <div style={{
            fontSize: '14px',
            color: 'var(--text-color-secondary)',
            lineHeight: '1.4'
          }}>
            <span>{t('roomList.labels.location', '位置')}：</span>
            <span>{item.location}</span>
          </div>
        )}

        {/* 创建时间 */}
        <div style={{
          fontSize: '12px',
          color: 'var(--text-color-tertiary)',
          lineHeight: '1.4'
        }}>
          <span className="num-mono" data-field="createTime">
            {t('roomList.labels.createTime', '创建时间')}：{formatDateTime(item.createTime)}
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
        placeholder={t('roomList.searchPlaceholder', '请输入教室名称')}
        allowClear
        style={{ width: '100%' }}
        onKeyPress={handleKeyPress}
        autoComplete="off"
      />
    </div>,
    <div key={`type-select-${selectKey}`} style={{ minWidth: '120px' }}>
      <Select
        placeholder={t('roomList.allTypes', '所有类型')}
        allowClear
        style={{ width: '100%' }}
        value={selectedType}
        onChange={(value) => {
          selectedTypeRef.current = value; // 立即更新 ref
          setSelectedType(value);
          setFloatKey(k => k + 1);
          setSelectKey(k => k + 1);
          handleSearchWithRef(); // 使用 ref 值搜索
        }}
      >
        <Option value="caseroom">{t('roomList.options.types.caseroom', '案例教室')}</Option>
        <Option value="seminar">{t('roomList.options.types.seminar', '研讨间')}</Option>
        <Option value="lab">{t('roomList.options.types.lab', '实验室')}</Option>
        <Option value="lecture">{t('roomList.options.types.lecture', '平面教室')}</Option>
      </Select>
    </div>,
    <div key={`status-select-${selectKey}`} style={{ minWidth: '120px' }}>
      <Select
        placeholder={t('roomList.allStatuses', '所有状态')}
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
        <Option value="available">{t('roomList.options.statuses.available', '空闲')}</Option>
        <Option value="reserved">{t('roomList.options.statuses.reserved', '已预约')}</Option>
        <Option value="using">{t('roomList.options.statuses.using', '使用中')}</Option>
        <Option value="maintenance">{t('roomList.options.statuses.maintenance', '维修中')}</Option>
        <Option value="cleaning">{t('roomList.options.statuses.cleaning', '清洁中')}</Option>
        <Option value="pending_cleaning">{t('roomList.options.statuses.pending_cleaning', '待清洁')}</Option>
        <Option value="pending_maintenance">{t('roomList.options.statuses.pending_maintenance', '待维修')}</Option>
        <Option value="unavailable">{t('roomList.options.statuses.unavailable', '不可用')}</Option>
      </Select>
    </div>,
    <div key="search-button">
      <Button
        type="primary"
        icon={<SearchOutlined />}
        onClick={handleSearch}
      >
        {t('common.search', '搜索')}
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
          setSelectedType(undefined);
          setSelectedStatus(undefined);
          // 清空搜索参数并刷新数据
          const newParams = {
            pageNum: 1,
            name: undefined,
            type: undefined,
            status: undefined
          };
          setSearchParams(newParams);
          setRooms([]);
          setTotal(0);
          setIsFiltering(false);
          setInputResetKey(k => k + 1);
          setSelectKey(k => k + 1);
          setFloatKey(k => k + 1);
          fetchRooms(newParams);
        }}
      >
        {t('common.clearFilters', '清空筛选')}
      </Button>
    </div>
  ], [inputResetKey, selectKey, selectedType, selectedStatus, handleKeyPress, handleSearchWithRef, handleSearch, t, fetchRooms, setRooms, setTotal, setIsFiltering, setInputResetKey, setSelectKey, setFloatKey]);

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
    ...(canCreateRoom(user?.role) ? [
      <ResponsiveButton
        key="add"
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddRoom}
        style={{ marginLeft: '8px' }}
        tooltip={t('roomList.actions.addRoom', '添加教室')}
      >
        {t('roomList.actions.addRoom', '添加教室')}
      </ResponsiveButton>
    ] : [])
  ], [handlePageRefresh, handleAddRoom, navigate, t, user?.role]);

  // 抽屉操作处理函数
  const handleViewDetail = useCallback((room) => {
    setCurrentRoom(room);
    setDrawerType('detail');
    setDrawerVisible(true);
  }, []);

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setDrawerType('');
    setCurrentRoom(null);
    // 重置表单
    addForm.resetFields();
    editForm.resetFields();
    form.resetFields();
  };

  // 处理添加教室
  const handleAddSubmit = async (values) => {
    try {
      await executeRooms(
        async () => {
          const roomData = {
            ...values,
            type: getRoomTypeEnumValue(values.type)
          };
          const response = await roomAPI.createRoom(roomData);
          messageApi.success(t('roomList.messages.addSuccess', '教室创建成功'));
          handleCloseDrawer();
          fetchRooms(); // 刷新列表
          return response;
        },
        {
          errorMessage: t('roomList.messages.addFail', '创建教室失败'),
          successMessage: t('roomList.messages.addSuccess', '教室创建成功')
        }
      );
    } catch (error) {
      console.error('创建教室失败:', error);
    }
  };

  // 处理编辑教室
  const handleEditSubmit = async (values) => {
    try {
      await executeRooms(
        async () => {
          const roomData = {
            ...currentRoom,
            ...values,
            type: getRoomTypeEnumValue(values.type)
          };
          const response = await roomAPI.updateRoom(currentRoom.id, roomData);
          messageApi.success(t('roomList.messages.updateSuccess', '教室更新成功'));
          handleCloseDrawer();
          fetchRooms(); // 刷新列表
          return response;
        },
        {
          errorMessage: t('roomList.messages.updateFail', '更新教室失败'),
          successMessage: t('roomList.messages.updateSuccess', '教室更新成功')
        }
      );
    } catch (error) {
      console.error('更新教室失败:', error);
    }
  };

  // 打开申请教室抽屉
  const handleApply = async (record) => {
    setDrawerType('apply');
    setCurrentRoom(record);
    form.resetFields();
    // 预填充教室信息
    form.setFieldsValue({
      room: record.id,
      roomName: record.name,
      roomLocation: record.location
    });
    setDrawerVisible(true);

    // 获取教室未来的已批准预约
    try {
      const response = await applicationAPI.getFutureApprovedApplications(record.id);
      console.log('未来预约数据:', response.data);
      setFutureApplications(response.data || []);
    } catch (error) {
      console.error('获取未来预约失败:', error);
      setFutureApplications([]);
    }
  };

  // 处理申请教室
  const handleApplySubmit = async (values) => {
    try {
      // 验证时间范围
      const [startTime, endTime] = values.timeRange;

      const validation = validateTimeRange(startTime, endTime);
      if (!validation.valid) {
        messageApi.error(validation.message);
        return;
      }

      // 检查时间冲突
      if (hasConflict) {
        messageApi.error(t('roomList.timeConflict', '所选时间段与已有预约冲突，请选择其他时间'));
        return;
      }

      await executeApplication(
        async () => {
          const applicationData = {
            userId: user.id, // 添加用户ID
            roomId: currentRoom.id,
            startTime: formatDateTimeForBackend(startTime),
            endTime: formatDateTimeForBackend(endTime),
            reason: values.reason,
            crowd: values.crowd,
            contact: values.contact,
            remark: values.remark
          };
          
          console.log('提交申请数据:', applicationData);
          const response = await applicationAPI.createApplication(applicationData);
          
          messageApi.success(t('roomList.messages.applySuccess', '申请提交成功，正在跳转到申请列表...'), 0.5).then(() => {
            handleCloseDrawer();
            if (user?.role === 'APPLIER') {
              navigate('/my-applications');
            } else if (user?.role === 'ADMIN') {
              navigate('/application-management');
            } else {
              navigate('/rooms');
            }
          });
          return response;
        },
        {
          errorMessage: t('roomList.messages.applyFail', '申请提交失败'),
          successMessage: t('roomList.messages.applySuccessBrief', '申请提交成功')
        }
      );
    } catch (error) {
      console.error('申请教室失败:', error);
    }
  };


  // List组件配置
  const ListProps = useMemo(() => ({
    loading: roomsLoading,
    dataSource: rooms,
  }), [roomsLoading, rooms]);

  // 权限检查 - APPLIER也应该能查看房间列表来申请房间
  const canView = canCreateRoom(user?.role) || canUpdateRoom(user?.role) || canDeleteRoom(user?.role) || canCreateApplication(user?.role);

  if (!canView) {
    return (
      <PageErrorBoundary>
        {contextHolder}
        <Result
          status="403"
          title="403"
          subTitle={t('common.noPermission')}
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              {t('common.backHome')}
            </Button>
          }
        />
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary onGoBack={handlePageRefresh}>
      {contextHolder}

      <ManagementPageContainerM
        key={`${searchParams.pageNum}-${searchParams.name}-${searchParams.type}-${searchParams.status}-${floatKey}`}
        actions={actions}
        filterThreshold={940}
        filterControls={filterControls}
        ListProps={ListProps}
        totalValue={total}
        fetchMore={fetchRooms}
        handleViewDetail={handleViewDetail}
        listItemBody={listItemBody}
        lengthOfData={rooms.length}
        setFloatContent={setFloatContent}
        searchParams={searchParams}
        isFilterCollapsed={isFilterCollapsed}
        onToggleFilter={toggleFilter}
        isFiltering={isFiltering}
      />

      {/* 抽屉组件 */}
      <Drawer
        title={
          drawerType === 'detail' ? t('roomList.drawer.detail') :
            drawerType === 'add' ? t('roomList.drawer.add') :
              drawerType === 'edit' ? t('roomList.drawer.edit') :
                drawerType === 'apply' ? t('roomList.drawer.apply') : ''
        }
        placement="bottom"
        height="80vh"
        open={drawerVisible}
        onClose={handleCloseDrawer}
        closable={false}
        bodyStyle={{ padding: 16 }}
        style={{ borderRadius: '16px 16px 0 0' }}
        footer={
          drawerType === 'detail' && currentRoom ? (
            <div style={{ margin: 8 }}>
              {canCreateApplication(user?.role) && (
                <Button
                  type="primary"
                  style={{ width: '100%', marginBottom: 12 }}
                  onClick={() => {
                    handleApply(currentRoom);
                  }}
                >
                  {t('roomList.actions.applyRoom', '申请教室')}
                </Button>
              )}
              {canUpdateRoom(user?.role) && (
                <Button
                  style={{ width: '100%', marginBottom: 12 }}
                  onClick={() => handleEditRoom(currentRoom)}
                >
                  {t('common.edit', '编辑')}
                </Button>
              )}
              {canDeleteRoom(user?.role) && (
                <Button
                  danger
                  style={{ width: '100%', marginBottom: 12 }}
                  onClick={() => {
                    handleDeleteRoom(currentRoom);
                    handleCloseDrawer();
                  }}
                >
                  {t('common.delete', '删除')}
                </Button>
              )}
              <Button
                style={{ width: '100%' }}
                onClick={handleCloseDrawer}
              >
                {t('common.close', '关闭')}
              </Button>
            </div>
          ) : drawerType === 'add' ? (
            <div style={{ margin: 8 }}>
              <Button
                type="primary"
                style={{ width: '100%', marginBottom: 12 }}
                onClick={() => addForm.submit()}
                loading={roomsLoading}
              >
                {t('common.create', '创建')}
              </Button>
              <Button
                style={{ width: '100%' }}
                onClick={handleCloseDrawer}
              >
                {t('common.cancel', '取消')}
              </Button>
            </div>
          ) : drawerType === 'edit' ? (
            <div style={{ margin: 8 }}>
              <Button
                type="primary"
                style={{ width: '100%', marginBottom: 12 }}
                onClick={() => editForm.submit()}
                loading={roomsLoading}
              >
                {t('common.save', '保存')}
              </Button>
              <Button
                style={{ width: '100%' }}
                onClick={handleCloseDrawer}
              >
                {t('common.cancel', '取消')}
              </Button>
            </div>
          ) : drawerType === 'apply' ? (
            <div style={{ margin: 8 }}>
              <Button
                type="primary"
                style={{ width: '100%', marginBottom: 12 }}
                onClick={() => form.submit()}
                loading={applicationLoading}
              >
                {t('roomList.actions.submitApplication', '提交申请')}
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
        {drawerType === 'detail' && currentRoom && (
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
                  <strong>{t('roomList.labels.name', '教室名称')}：</strong>
                  <span>{currentRoom.name}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('roomList.labels.type', '教室类型')}：</strong>
                  <span>{getRoomTypeDisplayName(currentRoom.type)}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('roomList.labels.status', '状态')}：</strong>
                  <Tag color={getRoomStatusColor(currentRoom.status)}>
                    {getRoomStatusDisplayName(currentRoom.status)}
                  </Tag>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('roomList.labels.capacity', '容量')}：</strong>
                  <span>{currentRoom.capacity}{t('roomList.labels.people', '人')}</span>
                </div>
                {currentRoom.location && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>{t('roomList.labels.location', '位置')}：</strong>
                    <span>{currentRoom.location}</span>
                  </div>
                )}
                {currentRoom.description && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>{t('roomList.labels.description', '描述')}：</strong>
                    <span>{currentRoom.description}</span>
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('roomList.labels.createTime', '创建时间')}：</strong>
                  <span className="num-mono">{formatDateTime(currentRoom.createTime)}</span>
                </div>
                {currentRoom.updateTime && (
                  <div>
                    <strong>{t('roomList.labels.updateTime', '更新时间')}：</strong>
                    <span className="num-mono">{formatDateTime(currentRoom.updateTime)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {drawerType === 'add' && (
          <Form
            form={addForm}
            layout="vertical"
            onFinish={handleAddSubmit}
          >
            <Form.Item
              name="name"
              label={t('roomList.form.name', '教室名称')}
              rules={[{ required: true, message: t('roomList.form.enterName', '请输入教室名称') }]}
            >
              <Input placeholder={t('roomList.form.enterName', '请输入教室名称')} />
            </Form.Item>

            <Form.Item
              name="type"
              label={t('roomList.form.type', '教室类型')}
              rules={[{ required: true, message: t('roomList.form.selectType', '请选择教室类型') }]}
            >
              <Select placeholder={t('roomList.form.selectType', '请选择教室类型')}>
                <Option value="caseroom">{t('roomList.options.types.caseroom', '案例教室')}</Option>
                <Option value="seminar">{t('roomList.options.types.seminar', '研讨间')}</Option>
                <Option value="lab">{t('roomList.options.types.lab', '实验室')}</Option>
                <Option value="lecture">{t('roomList.options.types.lecture', '平面教室')}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="capacity"
              label={t('roomList.form.capacity', '容量')}
              rules={[{ required: true, message: t('roomList.form.enterCapacity', '请输入容量') }]}
            >
              <InputNumber
                min={1}
                max={1000}
                placeholder={t('roomList.form.enterCapacity', '请输入容量')}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="location"
              label={t('roomList.form.location', '位置')}
            >
              <Input placeholder={t('roomList.form.enterLocation', '请输入位置（可选）')} />
            </Form.Item>

            <Form.Item
              name="status"
              label={t('roomList.form.status', '教室状态')}
              rules={[{ required: true, message: t('roomList.form.selectStatus', '请选择教室状态') }]}
              initialValue="AVAILABLE"
            >
              <Select placeholder={t('roomList.form.selectStatus', '请选择教室状态')}>
                {roomStatusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Tag color={getRoomStatusColor(option.value)}>{option.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label={t('roomList.form.description', '描述')}
            >
              <Input.TextArea
                placeholder={t('roomList.form.enterDescription', '请输入描述（可选）')}
                rows={3}
              />
            </Form.Item>
          </Form>
        )}

        {drawerType === 'edit' && currentRoom && (
          <Form
            form={editForm}
            layout="vertical"
            initialValues={{
              name: currentRoom.name,
              type: getRoomTypeFrontendValue(currentRoom.type),
              capacity: currentRoom.capacity,
              location: currentRoom.location || '',
              status: currentRoom.status || 'AVAILABLE',
              description: currentRoom.description || ''
            }}
            onFinish={handleEditSubmit}
          >
            <Form.Item
              name="name"
              label={t('roomList.form.name', '教室名称')}
              rules={[{ required: true, message: t('roomList.form.enterName', '请输入教室名称') }]}
            >
              <Input placeholder={t('roomList.form.enterName', '请输入教室名称')} />
            </Form.Item>

            <Form.Item
              name="type"
              label={t('roomList.form.type', '教室类型')}
              rules={[{ required: true, message: t('roomList.form.selectType', '请选择教室类型') }]}
            >
              <Select placeholder={t('roomList.form.selectType', '请选择教室类型')}>
                <Option value="caseroom">{t('roomList.options.types.caseroom', '案例教室')}</Option>
                <Option value="seminar">{t('roomList.options.types.seminar', '研讨间')}</Option>
                <Option value="lab">{t('roomList.options.types.lab', '实验室')}</Option>
                <Option value="lecture">{t('roomList.options.types.lecture', '平面教室')}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="capacity"
              label={t('roomList.form.capacity', '容量')}
              rules={[{ required: true, message: t('roomList.form.enterCapacity', '请输入容量') }]}
            >
              <InputNumber
                min={1}
                max={1000}
                placeholder={t('roomList.form.enterCapacity', '请输入容量')}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="location"
              label={t('roomList.form.location', '位置')}
            >
              <Input placeholder={t('roomList.form.enterLocation', '请输入位置（可选）')} />
            </Form.Item>

            <Form.Item
              name="status"
              label={t('roomList.form.status', '教室状态')}
              rules={[{ required: true, message: t('roomList.form.selectStatus', '请选择教室状态') }]}
            >
              <Select placeholder={t('roomList.form.selectStatus', '请选择教室状态')}>
                {roomStatusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Tag color={getRoomStatusColor(option.value)}>{option.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label={t('roomList.form.description', '描述')}
            >
              <Input.TextArea
                placeholder={t('roomList.form.enterDescription', '请输入描述（可选）')}
                rows={3}
              />
            </Form.Item>
          </Form>
        )}

        {drawerType === 'apply' && currentRoom && (
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
                  <strong>{t('roomList.form.name', '教室名称')}：</strong>
                  <span>{currentRoom.name}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('roomList.form.type', '教室类型')}：</strong>
                  <span>{getRoomTypeDisplayName(currentRoom.type)}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('roomList.labels.capacity', '容量')}：</strong>
                  <span>{currentRoom.capacity}{t('roomList.labels.people', '人')}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>{t('roomList.form.location', '位置')}：</strong>
                  <span>{currentRoom.location}</span>
                </div>
                <div>
                  <strong>{t('roomList.labels.status', '状态')}：</strong>
                  <Tag color={getRoomStatusColor(currentRoom.status)}>
                    {getRoomStatusDisplayName(currentRoom.status)}
                  </Tag>
                </div>
              </div>
            </div>

            {/* 未来预约信息 */}
            <div style={{
              marginBottom: 16,
              padding: 16,
              backgroundColor: 'var(--component-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 6
            }}>
              <h4 style={{ color: 'var(--text-color)', marginBottom: 12 }}>
                {t('roomList.detail.futureApprovedTitle', '未来已批准预约')} ({futureApplications.length})
              </h4>
              {futureApplications.length > 0 ? (
                <div style={{ color: 'var(--text-color)' }}>
                  {futureApplications.map((app, index) => (
                    <div key={app.id} style={{ marginBottom: 8, fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-color-secondary)' }}>
                        {(() => { 
                          const r = formatTimeRange(app.startTime, app.endTime, { structured: true }); 
                          return r.crossDay ? (
                            <span className="num-mono" data-field="timeRange">
                              <div>{r.startFormatted} -</div>
                              <div>{r.endFormatted}</div>
                            </span>
                          ) : (
                            <span className="num-mono" data-field="timeRange">{r.text}</span>
                          ); 
                        })()}
                      </span>
                      <span style={{ marginLeft: 8, color: 'var(--text-color-secondary)' }}>
                        - {app.reason}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  color: 'var(--text-color-secondary)',
                  textAlign: 'center',
                  padding: '20px',
                  fontSize: '14px'
                }}>
                  {t('roomList.detail.noneFuture', '暂无未来预约')}
                </div>
              )}
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleApplySubmit}
            >
              <Form.Item
                name="timeRange"
                label={t('roomList.form.timeRange', '使用时间')}
                rules={[{ required: true, message: t('roomList.form.selectTimeRange', '请选择使用时间') }]}
                validateStatus={hasConflict ? 'error' : ''}
                help={hasConflict ? conflictMessage : ''}
              >
                <RangePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder={[
                    t('roomList.form.timeRangePlaceholder.0', '开始时间'),
                    t('roomList.form.timeRangePlaceholder.1', '结束时间')
                  ]}
                  disabledDate={(current) => {
                    return current && current < dayjs().startOf('day');
                  }}
                  minuteStep={15}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      checkTimeConflict(dates[0], dates[1]);
                    } else {
                      clearConflict();
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                name="reason"
                label={t('roomList.form.reason', '使用原因')}
                rules={[{ required: true, message: t('roomList.form.enterReason', '请输入使用原因') }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder={t('roomList.form.enterReason', '请详细描述使用原因')}
                />
              </Form.Item>

              <Form.Item
                name="crowd"
                label={t('roomList.form.crowd', '使用人数')}
                rules={[{ required: true, message: t('roomList.form.enterCrowd', '请输入使用人数') }]}
              >
                <InputNumber
                  min={1}
                  max={currentRoom.capacity}
                  placeholder={t('roomList.form.enterCrowd', '请输入使用人数')}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="contact"
                label={t('roomList.form.contact', '联系方式')}
                rules={[{ required: true, message: t('roomList.form.enterContact', '请输入联系方式') }]}
              >
                <Input placeholder={t('roomList.form.enterContact', '请输入联系方式')} />
              </Form.Item>

              <Form.Item
                name="remark"
                label={t('roomList.form.remark', '备注')}
              >
                <Input.TextArea
                  rows={2}
                  placeholder={t('roomList.form.enterRemark', '请输入备注信息（可选）')}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>

      {/* 删除确认模态框 */}
      <Modal
        title={null}
        open={deleteModalVisible}
        onOk={executeDeleteRoom}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteRoomRecord(null);
        }}
        okText={t('roomList.modals.confirmDeleteOk', '确认删除')}
        cancelText={t('roomList.modals.cancel', '取消')}
        confirmLoading={roomsLoading}
        maskClosable={false}
        keyboard={false}
        closable={false}
        destroyOnHidden
        width="90%"
        style={{ maxWidth: '400px' }}
        footer={[
          <div key="modal-btn-row" style={{ display: 'flex', gap: 8, margin: '16px 0 0 0' }}>
            <Button
              key="cancel"
              style={{ flex: 1 }}
              onClick={() => {
                setDeleteModalVisible(false);
                setDeleteRoomRecord(null);
              }}
            >
              {t('roomList.modals.cancel', '取消')}
            </Button>
            <Button
              key="ok"
              type="primary"
              danger
              style={{ flex: 1 }}
              loading={roomsLoading}
              onClick={executeDeleteRoom}
            >
              {t('roomList.modals.confirmDeleteOk', '确认删除')}
            </Button>
          </div>
        ]}
      >
        {deleteRoomRecord && (
          <div style={{ textAlign: 'left' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-color)'
            }}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
              <span>{t('roomList.modals.confirmDeleteTitle', '确认删除教室')}</span>
            </div>
            <div style={{
              fontSize: '16px',
              color: 'var(--text-color)',
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              {t('roomList.modals.confirmDeleteQuestion', '确定删除以下教室？')}
              <br />
              <strong>"{deleteRoomRecord.name}"</strong>
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--text-color-secondary)',
              marginBottom: '8px'
            }}>
              {t('roomList.modals.warnIrreversible', '警告：此操作不可恢复，删除教室将同时删除所有相关的申请记录。')}
            </div>
          </div>
        )}
      </Modal>
    </PageErrorBoundary>
  );
}

// 导出的主组件，用 App 包装以提供 modal 上下文
export default function RoomList(props) {
  return (
    <App>
      <RoomListContent setFloatContent={props.setFloatContent} />
    </App>
  );
}
