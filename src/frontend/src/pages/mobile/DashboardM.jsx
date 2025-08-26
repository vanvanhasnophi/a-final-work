import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Button, Tag, Space } from 'antd';
import { UserOutlined, HomeOutlined, CalendarOutlined, SettingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { roomAPI } from '../../api/room';
import { applicationAPI } from '../../api/application';
import { dutyAPI } from '../../api/duty';
import { useApiWithRetry } from '../../hooks/useApiWithRetry';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { canViewOwnApplications } from '../../utils/permissionUtils';
import LatestNews from '../../components/LatestNews';
import { useI18n } from '../../contexts/I18nContext';
import { useActivities } from '../../hooks/useActivities';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    myPendingApplications: 0,
    allPendingApplications: 0,
    onlineUsers: 0,
    // maintainer和service相关统计
    pendingCleaningRooms: 0,
    pendingMaintenanceRooms: 0,
    cleaningRooms: 0,
    maintenanceRooms: 0,
    todayCleaningReports: 0,
    todayMaintenanceReports: 0
  });
  const [todayDuty, setTodayDuty] = useState(null);
  const { loading, executeWithRetry } = useApiWithRetry();
  
  // 使用活动Hook
  const { 
    activities: recentActivities, 
    refreshActivities: refreshRecentActivities 
  } = useActivities({
    type: 'all',
    userId: user?.id,
    userRole: user?.role,
    limit: 6,
    autoRefresh: false
  });

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    const result = await executeWithRetry(
      async () => {
        // 获取教室数据
        const roomResponse = await roomAPI.getRoomList({ pageSize: 1000 });
        const rooms = roomResponse.data.records || [];
        
        // 根据角色决定是否获取申请数据
        let allApplications = [];
        let myApplications = [];
        
        if (user?.role === 'ADMIN' || user?.role === 'APPROVER' || user?.role === 'APPLIER') {
          // 只有ADMIN、APPROVER、APPLIER角色才获取申请数据
          const [allApplicationsResponse, myApplicationsResponse] = await Promise.all([
            applicationAPI.getApplicationList({ pageSize: 1000 }),
            applicationAPI.getApplicationList({ pageSize: 1000, userId: user?.id })
          ]);
          
          allApplications = allApplicationsResponse.data.records || [];
          myApplications = myApplicationsResponse.data.records || [];
        }
        
        // 计算统计数据
        const totalRooms = rooms.length;
        const availableRooms = rooms.filter(room => room.status === 'AVAILABLE').length;
        const allPendingApplications = allApplications.filter(app => app.status === 'PENDING').length;
        const myPendingApplications = myApplications.filter(app => app.status === 'PENDING').length;
        
        // maintainer和service相关统计
        const pendingCleaningRooms = rooms.filter(room => room.status === 'PENDING_CLEANING').length;
        const pendingMaintenanceRooms = rooms.filter(room => room.status === 'PENDING_MAINTENANCE').length;
        const cleaningRooms = rooms.filter(room => room.status === 'CLEANING').length;
        const maintenanceRooms = rooms.filter(room => room.status === 'MAINTENANCE').length;
        
        setStats({
          totalRooms,
          availableRooms,
          myPendingApplications,
          allPendingApplications,
          onlineUsers: Math.floor(Math.random() * 50) + 10, // 模拟在线用户数
          // maintainer和service相关统计
          pendingCleaningRooms,
          pendingMaintenanceRooms,
          cleaningRooms,
          maintenanceRooms,
          todayCleaningReports: 0, // 占位，暂不实现
          todayMaintenanceReports: 0 // 占位，暂不实现
        });
        
        // 获取今日值班人信息
        try {
          const dutyResponse = await dutyAPI.getTodayDuty();
          setTodayDuty(dutyResponse.data);
        } catch (error) {
          console.log('获取今日值班人信息失败:', error);
          setTodayDuty(null);
        }
        
        return { rooms, allApplications, myApplications };
      },
      {
        errorMessage: t('dashboard.fetchError'),
        maxRetries: 2,
        retryDelay: 3000
      }
    );
    
    return result;
  }, [executeWithRetry, user?.id, user?.role]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 移除重复的活动获取逻辑，使用Hook

  // 根据用户角色决定显示哪些卡片
  const isAdmin = user?.role === 'ADMIN';
  const isApprover = user?.role === 'APPROVER';
  const isMaintainer = user?.role === 'MAINTAINER';
  const isService = user?.role === 'SERVICE';
  const canViewAllPending = isAdmin || isApprover;

  // 快速操作处理函数
  const handleQuickAction = (action) => {
    switch (action) {
      case 'apply':
        navigate('/rooms');
        break;
      case 'myApplications':
        navigate('/my-applications');
        break;
      case 'allApplications':
        navigate('/application-management');
        break;
      case 'userManagement':
        navigate('/users');
        break;
      case 'roomManagement':
        navigate('/rooms');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  return (
    <LoadingSpinner loading={loading} text={t('dashboard.loadingStats')}>
        <div style={{ padding: '24px' }}>
      <h1>{t('dashboard.overviewTitle')}</h1>
          
          {/* 第一行：数据展示 - 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            {/* 通用统计卡片 */}
            <Col span={windowWidth < 600 ? 24 : 6}>
              <Card>
                <Statistic
                  title={t('dashboard.stats.totalRooms')}
                  value={stats.totalRooms}
                  prefix={<HomeOutlined />}
                />
              </Card>
            </Col>
            
            {/* 根据角色显示不同的统计卡片 */}
            {!isMaintainer && !isService && (
              <>
                <Col span={windowWidth < 600 ? 24 : 6}>
                  <Card>
                    <Statistic
                      title={t('dashboard.stats.availableRooms')}
                      value={stats.availableRooms}
                      prefix={<HomeOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col span={windowWidth < 600 ? 24 : 6}>
                  <Card>
                    <Statistic
                      title={t('dashboard.stats.myPending')}
                      value={stats.myPendingApplications}
                      prefix={<CalendarOutlined />}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                {canViewAllPending && (
                  <Col span={windowWidth < 600 ? 24 : 6}>
                    <Card>
                      <Statistic
                        title={t('dashboard.stats.allPending')}
                        value={stats.allPendingApplications}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                )}
                {!canViewAllPending && (
                  <Col span={windowWidth < 600 ? 24 : 6}>
                    <Card>
                      <Statistic
                        title={t('dashboard.stats.onlineUsers')}
                        value={stats.onlineUsers}
                        prefix={<UserOutlined />}
                      />
                    </Card>
                  </Col>
                )}
              </>
            )}
            
            {/* Maintainer专用统计卡片 */}
            {isMaintainer && (
              <>
                <Col span={windowWidth < 600 ? 24 : 6}>
                  <Card>
                    <Statistic
                      title={t('dashboard.stats.pendingMaintenanceRooms')}
                      value={stats.pendingMaintenanceRooms}
                      prefix={<SettingOutlined />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Card>
                </Col>
                <Col span={windowWidth < 600 ? 24 : 6}>
                  <Card>
                    <Statistic
                      title={t('dashboard.stats.maintenanceRooms')}
                      value={stats.maintenanceRooms}
                      prefix={<SettingOutlined />}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col span={windowWidth < 600 ? 24 : 6}>
                  <Card>
                    <Statistic
                      title={t('dashboard.stats.todayMaintenanceReports')}
                      value={stats.todayMaintenanceReports}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
              </>
            )}
            
            {/* Service专用统计卡片 */}
            {isService && (
              <>
                <Col span={windowWidth < 600 ? 24 : 6}>
                  <Card>
                    <Statistic
                      title={t('dashboard.stats.pendingCleaningRooms')}
                      value={stats.pendingCleaningRooms}
                      prefix={<HomeOutlined />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Card>
                </Col>
                <Col span={windowWidth < 600 ? 24 : 6}>
                  <Card>
                    <Statistic
                      title={t('dashboard.stats.cleaningRooms')}
                      value={stats.cleaningRooms}
                      prefix={<HomeOutlined />}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col span={windowWidth < 600 ? 24 : 6}>
                  <Card>
                    <Statistic
                      title={t('dashboard.stats.todayCleaningReports')}
                      value={stats.todayCleaningReports}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
              </>
            )}
          </Row>

          {/* 第二行：快速操作单独一行 */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={24}>
              <Card 
                title={t('dashboard.quickActionsTitle')} 
                extra={
                  <SettingOutlined 
                    style={{ 
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: 'var(--text-color-secondary)',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--primary-color)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--text-color-secondary)';
                    }}
                    onClick={() => handleQuickAction('settings')}
                    title={t('dashboard.quickActions.goToSettings', '前往设置')}
                  />
                }
              >
                {/* 申请教室按钮：审批员(Approver)不展示 */}
                {!isMaintainer && !isService && !isApprover && (
                  <Button 
                    type="primary" 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('apply')}
                  >
                    {t('dashboard.buttons.applyRoom')}
                  </Button>
                )}
                {canViewOwnApplications(user?.role) && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('myApplications')}
                  >
                    {t('dashboard.buttons.myApplications')}
                  </Button>
                )}
                {canViewAllPending && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('allApplications')}
                  >
                    {t('dashboard.buttons.allApplications')}
                  </Button>
                )}
                {isAdmin && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('userManagement')}
                  >
                    {t('dashboard.buttons.userManagement')}
                  </Button>
                )}
                {isAdmin && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('roomManagement')}
                  >
                    {t('dashboard.buttons.roomManagement')}
                  </Button>
                )}
                {isMaintainer && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('roomManagement')}
                  >
                    {t('dashboard.buttons.roomManagement')}
                  </Button>
                )}
                {isService && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('roomManagement')}
                  >
                    {t('dashboard.buttons.roomManagement')}
                  </Button>
                )}
              </Card>
            </Col>
          </Row>

          {/* 第三行：今日值班和最新动态一行 */}
          <Row gutter={16}>
            {/* 今日值班卡片 - 仅对管理员和审批员展示 */}
            {(user?.role === 'ADMIN' || user?.role === 'APPROVER') && todayDuty && (
              <Col span={windowWidth < 768 ? 24 : 12}>
                <Card
                  title={
                    <Space>
                      <UserOutlined />
                      {t('dashboard.todayDuty.title', '今日值班')}
                    </Space>
                  }
                  hoverable
                  style={{ height: '200px' }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {todayDuty.dutyUserNickname || todayDuty.dutyUserName}
                      {todayDuty.dutyUserNickname && todayDuty.dutyUserName && (
                        <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '4px' }}>
                          ({todayDuty.dutyUserName})
                        </span>
                      )}
                    </div>
                    {(todayDuty.dutyUserPhone || todayDuty.dutyUserEmail) && (
                      <div style={{ marginBottom: '8px' }}>
                        {todayDuty.dutyUserPhone && (
                          <Tag color="green">📞 {todayDuty.dutyUserPhone}</Tag>
                        )}
                        {todayDuty.dutyUserEmail && (
                          <Tag color="blue" style={{ marginLeft: todayDuty.dutyUserPhone ? '4px' : '0' }}>
                            ✉️ {todayDuty.dutyUserEmail}
                          </Tag>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                      {dayjs().format('YYYY-MM-DD')}
                    </div>
                    {todayDuty.remark && (
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px', fontStyle: 'italic' }}>
                        {todayDuty.remark}
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            )}

            {/* 最新动态 - 仅对管理员和审批员展示 */}
            {(user?.role === 'ADMIN' || user?.role === 'APPROVER') && (
              <Col span={windowWidth < 768 ? 24 : (todayDuty ? 12 : 24)}>
                <Card title={t('dashboard.latestNewsTitle')} extra={
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={refreshRecentActivities}
                  >
                    {t('common.refresh')}
                  </Button>
                }>
                  <LatestNews
                    activities={recentActivities}
                    loading={false}
                    maxItems={6}
                    emptyText={t('dashboard.latestNewsEmpty')}
                    height="calc(100vh - 350px)"
                    minHeight="200px"
                  />
                </Card>
              </Col>
            )}
          </Row>
        </div>
      </LoadingSpinner>
  );
} 