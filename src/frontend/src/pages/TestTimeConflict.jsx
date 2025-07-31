import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Tag } from 'antd';
import { applicationAPI } from '../api/application';
import { formatTimeRange } from '../utils/dateFormat';

export default function TestTimeConflict() {
  const [roomId, setRoomId] = useState(1); // 测试房间ID
  const [futureApplications, setFutureApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFutureApplications = async () => {
    setLoading(true);
    try {
      const response = await applicationAPI.getFutureApprovedApplications(roomId);
      setFutureApplications(response.data || []);
      message.success(`获取到 ${response.data?.length || 0} 个未来预约`);
    } catch (error) {
      console.error('获取未来预约失败:', error);
      message.error('获取未来预约失败');
    } finally {
      setLoading(false);
    }
  };

  const testTimeConflict = async () => {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 明天
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2小时后
      
      const response = await applicationAPI.checkTimeConflict(roomId, startTime, endTime);
      message.info(`时间冲突检查结果: ${response.data ? '有冲突' : '无冲突'}`);
    } catch (error) {
      console.error('时间冲突检查失败:', error);
      message.error('时间冲突检查失败');
    }
  };

  useEffect(() => {
    fetchFutureApplications();
  }, [roomId]);

  return (
    <div style={{ padding: 24 }}>
      <h2>时间冲突检查测试</h2>
      
      <Card title="测试控制" style={{ marginBottom: 16 }}>
        <Space>
          <Button onClick={fetchFutureApplications} loading={loading}>
            刷新未来预约
          </Button>
          <Button onClick={testTimeConflict}>
            测试时间冲突检查
          </Button>
        </Space>
      </Card>

      <Card title={`房间 ${roomId} 的未来已批准预约 (${futureApplications.length}个)`}>
        {futureApplications.length === 0 ? (
          <p>暂无未来预约</p>
        ) : (
          <div>
            {futureApplications.map((app) => (
              <div key={app.id} style={{ 
                padding: 12, 
                marginBottom: 8, 
                border: '1px solid #d9d9d9', 
                borderRadius: 6,
                backgroundColor: '#fafafa'
              }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>时间：</strong>
                  {formatTimeRange(app.startTime, app.endTime)}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>申请人：</strong>
                  {app.userNickname || app.username}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>用途：</strong>
                  {app.reason}
                </div>
                <div>
                  <strong>状态：</strong>
                  <Tag color="success">已批准</Tag>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
} 