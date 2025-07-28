import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, message } from 'antd';
import { UserOutlined, HomeOutlined, CalendarOutlined, SettingOutlined } from '@ant-design/icons';
import { roomAPI } from '../api/room';
import { applicationAPI } from '../api/application';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    pendingApplications: 0,
    onlineUsers: 0
  });
  const [loading, setLoading] = useState(false);

  // 获取统计数据
  const fetchStats = async () => {
    setLoading(true);
    try {
      // 获取房间统计
      const roomResponse = await roomAPI.getRoomList({ pageSize: 1000 });
      const rooms = roomResponse.data.records || [];
      
      // 获取申请统计
      const applicationResponse = await applicationAPI.getAllApplications();
      const applications = applicationResponse.data || [];
      
      // 计算统计数据
      const totalRooms = rooms.length;
      const availableRooms = rooms.filter(room => room.status === '可用').length;
      const pendingApplications = applications.filter(app => app.status === '待审批').length;
      
      setStats({
        totalRooms,
        availableRooms,
        pendingApplications,
        onlineUsers: Math.floor(Math.random() * 50) + 10 // 模拟在线用户数
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <h1>RoomX 管理系统</h1>
      
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总房间数"
              value={stats.totalRooms}
              prefix={<HomeOutlined />}
              loading={loading}
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
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="申请中"
              value={stats.pendingApplications}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#cf1322' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线用户"
              value={stats.onlineUsers}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="快速操作" extra={<SettingOutlined />}>
            <Button type="primary" style={{ marginRight: '8px' }}>
              申请房间
            </Button>
            <Button style={{ marginRight: '8px' }}>
              查看申请
            </Button>
            <Button>
              房间管理
            </Button>
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
  );
} 