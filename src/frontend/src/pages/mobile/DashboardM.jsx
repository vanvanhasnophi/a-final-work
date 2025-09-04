import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Row, Col, Statistic, Button, Tag, Space, List, message } from 'antd';
import { UserOutlined, HomeOutlined, CalendarOutlined, SettingOutlined, ClockCircleOutlined, BellOutlined } from '@ant-design/icons';
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
import { useFootprints } from '../../hooks/useFootprints';
import { notificationAPI } from '../../api/notification';
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
  
  // 使用动态Hook
  const { 
    footprints: recentFootprints, 
    refresh: refreshRecentFootprints 
  } = useFootprints({
    type: 'visible',
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

  // 图标常量，避免重复创建
  const ICONS = useMemo(() => ({
    home: <HomeOutlined />,
    calendar: <CalendarOutlined />,
    clock: <ClockCircleOutlined />,
    setting: <SettingOutlined />,
    user: <UserOutlined />
  }), []);

  // 样式常量，避免重复创建
  const STYLES = useMemo(() => ({
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0'
    },
    leftContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    title: { fontSize: '16px' },
    value: { fontSize: '24px', fontWeight: 'bold' }
  }), []);

  // 准备统计数据列表
  const getStatsList = useCallback(() => {
    const statsList = [];

    // 通用统计 - 总教室数
    statsList.push({
      title: t('dashboard.stats.totalRooms'),
      value: stats.totalRooms,
      icon: ICONS.home,
      color: '#1890ff'
    });

    if (!isMaintainer && !isService) {
      // 普通用户和管理员的统计
      statsList.push({
        title: t('dashboard.stats.availableRooms'),
        value: stats.availableRooms,
        icon: ICONS.home,
        color: '#3f8600'
      });

      statsList.push({
        title: t('dashboard.stats.myPending'),
        value: stats.myPendingApplications,
        icon: ICONS.calendar,
        color: '#cf1322'
      });

      if (canViewAllPending) {
        statsList.push({
          title: t('dashboard.stats.allPending'),
          value: stats.allPendingApplications,
          icon: ICONS.clock,
          color: '#fa8c16'
        });
      } else {
        statsList.push({
          title: t('dashboard.stats.onlineUsers'),
          value: stats.onlineUsers,
          icon: ICONS.user,
          color: '#1890ff'
        });
      }
    }

    if (isMaintainer) {
      // Maintainer专用统计
      statsList.push({
        title: t('dashboard.stats.pendingMaintenanceRooms'),
        value: stats.pendingMaintenanceRooms,
        icon: ICONS.setting,
        color: '#fa8c16'
      });

      statsList.push({
        title: t('dashboard.stats.maintenanceRooms'),
        value: stats.maintenanceRooms,
        icon: ICONS.setting,
        color: '#cf1322'
      });

      statsList.push({
        title: t('dashboard.stats.todayMaintenanceReports'),
        value: stats.todayMaintenanceReports,
        icon: ICONS.clock,
        color: '#1890ff'
      });
    }

    if (isService) {
      // Service专用统计
      statsList.push({
        title: t('dashboard.stats.pendingCleaningRooms'),
        value: stats.pendingCleaningRooms,
        icon: ICONS.home,
        color: '#fa8c16'
      });

      statsList.push({
        title: t('dashboard.stats.cleaningRooms'),
        value: stats.cleaningRooms,
        icon: ICONS.home,
        color: '#cf1322'
      });

      statsList.push({
        title: t('dashboard.stats.todayCleaningReports'),
        value: stats.todayCleaningReports,
        icon: ICONS.clock,
        color: '#1890ff'
      });
    }

    return statsList;
  }, [stats, isMaintainer, isService, canViewAllPending, t, ICONS]);

  // 判断是否使用窄屏布局
  const isNarrow = windowWidth < 600;

  // 快速操作处理函数
  const handleQuickAction = async (action) => {
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
      case 'sendTestNotification':
        try {
          message.loading({ content: '正在发送测试通知...', key: 'sendTest' });
          console.log('发送测试通知请求...');
          
          const response = await notificationAPI.sendTestNotification();
          console.log('测试通知发送响应:', response);
          
          message.success({ 
            content: '测试通知发送成功！请查看通知中心', 
            key: 'sendTest',
            duration: 3
          });
        } catch (error) {
          console.error('发送测试通知失败:', error);
          message.error({ 
            content: `发送测试通知失败: ${error?.response?.data?.message || error.message}`, 
            key: 'sendTest',
            duration: 5
          });
        }
        break;
      default:
        break;
    }
  };

  return (
    <LoadingSpinner loading={loading} text={t('dashboard.loadingStats')}>
        <div style={{ padding: '24px' }}>
      <h1>{t('dashboard.overviewTitle')}</h1>
          
          {/* 数据展示 - 根据屏幕宽度选择展示方式 */}
          {isNarrow ? (
            // 窄屏时使用List展示
            <Card 
              style={{ marginBottom: '24px' , padding: '0px'}}
              styles={{ body: { paddingTop: '4px',paddingBottom:'4px' } }}
            >
              <List
                dataSource={getStatsList()}
                renderItem={(item) => (
                  <List.Item style={STYLES.listItem}>
                    <div style={STYLES.leftContent}>
                      <span style={{ color: item.color, fontSize: '18px' }}>
                        {item.icon}
                      </span>
                      <span style={STYLES.title}>
                        {item.title}
                      </span>
                    </div>
                    <span style={{ 
                      ...STYLES.value,
                      color: item.color 
                    }}>
                      {item.value}
                    </span>
                  </List.Item>
                )}
              />
            </Card>
          ) : (
            // 宽屏时使用卡片网格展示
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              {getStatsList().map((item, index) => (
                <Col key={index} span={6}>
                  <Card>
                    <Statistic
                      title={item.title}
                      value={item.value}
                      prefix={item.icon}
                      valueStyle={{ color: item.color }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}

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
                  <>
                    <Button 
                      style={{ marginRight: '8px', marginBottom: '8px' }}
                      onClick={() => handleQuickAction('userManagement')}
                    >
                      {t('dashboard.buttons.userManagement')}
                    </Button>
                    <Button 
                      style={{ marginRight: '8px', marginBottom: '8px' }}
                      onClick={() => handleQuickAction('roomManagement')}
                    >
                      {t('dashboard.buttons.roomManagement')}
                    </Button>
                    <Button 
                      icon={<BellOutlined />}
                      style={{ marginRight: '8px', marginBottom: '8px' }}
                      onClick={() => handleQuickAction('sendTestNotification')}
                      title="发送测试通知给自己"
                    >
                      测试通知
                    </Button>
                  </>
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
                    onClick={refreshRecentFootprints}
                  >
                    {t('common.refresh')}
                  </Button>
                }>
                  <LatestNews
                    footprints={recentFootprints}
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