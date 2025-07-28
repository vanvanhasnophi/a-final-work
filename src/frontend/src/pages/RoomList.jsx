import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Input, Select } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // 模拟数据
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setRooms([
        {
          id: 1,
          name: '会议室A',
          type: '会议室',
          capacity: 20,
          status: '可用',
          location: '1楼',
          equipment: '投影仪,白板'
        },
        {
          id: 2,
          name: '会议室B',
          type: '会议室',
          capacity: 15,
          status: '使用中',
          location: '2楼',
          equipment: '投影仪'
        },
        {
          id: 3,
          name: '培训室',
          type: '培训室',
          capacity: 50,
          status: '维护中',
          location: '3楼',
          equipment: '投影仪,音响,麦克风'
        },
        {
          id: 4,
          name: '小会议室',
          type: '会议室',
          capacity: 8,
          status: '可用',
          location: '1楼',
          equipment: '白板'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const columns = [
    {
      title: '房间名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => `${capacity}人`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        if (status === '使用中') color = 'orange';
        if (status === '维护中') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '设备',
      dataIndex: 'equipment',
      key: 'equipment',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small">查看详情</Button>
          <Button type="link" size="small">申请使用</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="房间管理">
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Search
              placeholder="搜索房间"
              style={{ width: 200 }}
              onSearch={value => console.log(value)}
            />
            <Select defaultValue="all" style={{ width: 120 }}>
              <Option value="all">全部类型</Option>
              <Option value="meeting">会议室</Option>
              <Option value="training">培训室</Option>
            </Select>
            <Select defaultValue="all" style={{ width: 120 }}>
              <Option value="all">全部状态</Option>
              <Option value="available">可用</Option>
              <Option value="occupied">使用中</Option>
              <Option value="maintenance">维护中</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />}>
              添加房间
            </Button>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={rooms}
          rowKey="id"
          loading={loading}
          pagination={{
            total: rooms.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
} 