import React from 'react';
import { Card, Row, Col, Statistic, Button } from 'antd';
import { UserOutlined, HomeOutlined, CalendarOutlined, SettingOutlined } from '@ant-design/icons';

export default function Dashboard() {
  return (
    <div style={{ padding: '24px' }}>
      <h1>RoomX 管理系统</h1>
      
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总房间数"
              value={112}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="可用房间"
              value={85}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="申请中"
              value={12}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线用户"
              value={28}
              prefix={<UserOutlined />}
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