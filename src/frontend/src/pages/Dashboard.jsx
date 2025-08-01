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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    myPendingApplications: 0,
    allPendingApplications: 0,
    onlineUsers: 0
  });
  const [messageApi, contextHolder] = message.useMessage();
  const { loading, error, executeWithRetry } = useApiWithRetry();

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    const result = await executeWithRetry(
      async () => {
        // 并行请求以提高性能
        const [roomResponse, allApplicationsResponse, myApplicationsResponse] = await Promise.all([
          roomAPI.getRoomList({ pageSize: 1000 }),
          applicationAPI.getApplicationList({ pageSize: 1000 }),
          applicationAPI.getApplicationList({ pageSize: 1000, userId: user?.id })
        ]);
        
        const rooms = roomResponse.data.records || [];
        const allApplications = allApplicationsResponse.data.records || [];
        const myApplications = myApplicationsResponse.data.records || [];
        
        // 计算统计数据
        const totalRooms = rooms.length;
        const availableRooms = rooms.filter(room => room.status === 'AVAILABLE').length;
        const allPendingApplications = allApplications.filter(app => app.status === 'PENDING').length;
        const myPendingApplications = myApplications.filter(app => app.status === 'PENDING').length;
        
        setStats({
          totalRooms,
          availableRooms,
          myPendingApplications,
          allPendingApplications,
          onlineUsers: Math.floor(Math.random() * 50) + 10 // 模拟在线用户数
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
  }, [executeWithRetry, user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 根据用户角色决定显示哪些卡片
  const isAdmin = user?.role === 'ADMIN';
  const isApprover = user?.role === 'APPROVER';
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
        navigate('/applications');
        break;
      case 'userManagement':
        navigate('/users');
        break;
      case 'roomManagement':
        messageApi.info('房间管理功能开发中...');
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
            <Col span={6}>
              <Card>
                <Statistic
                  title="总房间数"
                  value={stats.totalRooms}
                  prefix={<HomeOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="可用房间"
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
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="快速操作" extra={<SettingOutlined />}>
                <Button 
                  type="primary" 
                  style={{ marginRight: '8px', marginBottom: '8px' }}
                  onClick={() => handleQuickAction('apply')}
                >
                  申请房间
                </Button>
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
                    style={{ marginBottom: '8px' }}
                    onClick={() => handleQuickAction('roomManagement')}
                  >
                    房间管理
                  </Button>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="最近活动">
                <p>用户张三申请了会议室A</p>
                <p>管理员批准了李四的申请</p>
                <p>王五取消了会议室B的预约</p>
              </Card>
            </Col>
          </Row>
        </div>
      </LoadingSpinner>
    </>
  );
} 