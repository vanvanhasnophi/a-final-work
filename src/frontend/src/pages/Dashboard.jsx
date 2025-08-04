import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Button, message } from 'antd';
import { UserOutlined, HomeOutlined, CalendarOutlined, SettingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { roomAPI } from '../api/room';
import { applicationAPI } from '../api/application';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import LoadingSpinner from '../components/LoadingSpinner';
import { getApplicationStatusDisplayName } from '../utils/statusMapping';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDisplayName } from '../utils/roleMapping';
import { useNavigate } from 'react-router-dom';
import { canViewOwnApplications } from '../utils/permissionUtils';
import LatestNews from '../components/LatestNews';
import { useActivities } from '../hooks/useActivities';

export default function Dashboard() {
  const { user } = useAuth();
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
  const [messageApi, contextHolder] = message.useMessage();
  const { loading, error, executeWithRetry } = useApiWithRetry();
  
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
        
        return { rooms, allApplications, myApplications };
      },
      {
        errorMessage: '获取统计数据失败，请检查网络连接',
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
      default:
        break;
    }
  };

  return (
    <>
      {contextHolder}
      <LoadingSpinner loading={loading} text="正在加载统计数据...">
        <div style={{ padding: '24px' }}>
          <h1>概览</h1>
          
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            {/* 通用统计卡片 */}
            <Col span={6}>
              <Card>
                <Statistic
                  title="总教室数"
                  value={stats.totalRooms}
                  prefix={<HomeOutlined />}
                />
              </Card>
            </Col>
            
            {/* 根据角色显示不同的统计卡片 */}
            {!isMaintainer && !isService && (
              <>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="可用教室"
                      value={stats.availableRooms}
                      prefix={<HomeOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="申请中"
                      value={stats.myPendingApplications}
                      prefix={<CalendarOutlined />}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                {canViewAllPending && (
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="待处理申请"
                        value={stats.allPendingApplications}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                )}
                {!canViewAllPending && (
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="在线用户"
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
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="待维修教室"
                      value={stats.pendingMaintenanceRooms}
                      prefix={<SettingOutlined />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="维修中教室"
                      value={stats.maintenanceRooms}
                      prefix={<SettingOutlined />}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="今日报修数"
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
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="待清洁教室"
                      value={stats.pendingCleaningRooms}
                      prefix={<HomeOutlined />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="清洁中教室"
                      value={stats.cleaningRooms}
                      prefix={<HomeOutlined />}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="今日报清洁数"
                      value={stats.todayCleaningReports}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
              </>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="快速操作" extra={<SettingOutlined />}>
                {!isMaintainer && !isService && (
                  <Button 
                    type="primary" 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('apply')}
                  >
                    申请教室
                  </Button>
                )}
                {canViewOwnApplications(user?.role) && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('myApplications')}
                  >
                    我的申请
                  </Button>
                )}
                {canViewAllPending && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('allApplications')}
                  >
                    全部申请
                  </Button>
                )}
                {isAdmin && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('userManagement')}
                  >
                    用户管理
                  </Button>
                )}
                {isAdmin && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('roomManagement')}
                  >
                    教室管理
                  </Button>
                )}
                {isMaintainer && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('roomManagement')}
                  >
                    教室管理
                  </Button>
                )}
                {isService && (
                  <Button 
                    style={{ marginRight: '8px', marginBottom: '8px' }}
                    onClick={() => handleQuickAction('roomManagement')}
                  >
                    教室管理
                  </Button>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="最新动态" extra={
                <Button 
                  type="link" 
                  size="small" 
                  onClick={refreshRecentActivities}
                >
                  刷新
                </Button>
              }>
                <LatestNews
                  activities={recentActivities}
                  loading={false}
                  maxItems={6}
                  emptyText="暂无最新动态"
                  height="calc(100vh - 350px)"
                  minHeight="200px"
                />
              </Card>
            </Col>
          </Row>
        </div>
      </LoadingSpinner>
    </>
  );
} 