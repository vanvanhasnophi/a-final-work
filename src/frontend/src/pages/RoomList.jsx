import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Card, Button, Tag, Space, Input, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { roomAPI } from '../api/room';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { useDebounce } from '../hooks/useDebounce';

const { Search } = Input;
const { Option } = Select;

export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState({
    pageNum: 1,
    pageSize: 10,
  });
  const [messageApi, contextHolder] = message.useMessage();
  
  const { loading, error, executeWithRetry } = useApiWithRetry();
  const { debounce, clearDebounce } = useDebounce(500);

  // 获取房间列表
  const fetchRooms = useCallback(async (params = {}) => {
    const result = await executeWithRetry(
      async () => {
        const response = await roomAPI.getRoomList({
          ...searchParams,
          ...params,
        });
        
        const { records, total, current, size } = response.data;
        setRooms(records || []);
        setPagination({
          current: current || 1,
          pageSize: size || 10,
          total: total || 0,
        });
        
        return response.data;
      },
      {
        errorMessage: '获取房间列表失败，请检查网络连接',
        maxRetries: 2,
        retryDelay: 3000
      }
    );
    
    return result;
  }, [executeWithRetry, searchParams]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // 清理定时器
  useEffect(() => {
    return () => {
      clearDebounce();
    };
  }, [clearDebounce]);

  const handleTableChange = (pagination, filters, sorter) => {
    const newParams = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    setSearchParams(newParams);
    fetchRooms(newParams);
  };

  const handleSearch = (value) => {
    const newParams = {
      ...searchParams,
      pageNum: 1,
      name: value,
    };
    setSearchParams(newParams);
    debounce(() => fetchRooms(newParams));
  };

  const handleTypeFilter = (value) => {
    const newParams = {
      ...searchParams,
      pageNum: 1,
      type: value === 'all' ? undefined : value,
    };
    setSearchParams(newParams);
    debounce(() => fetchRooms(newParams));
  };

  const handleStatusFilter = (value) => {
    const newParams = {
      ...searchParams,
      pageNum: 1,
      status: value === 'all' ? undefined : value,
    };
    setSearchParams(newParams);
    debounce(() => fetchRooms(newParams));
  };

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
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
      <Card title="房间管理">
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Search
              placeholder="搜索房间"
              style={{ width: 200 }}
              onSearch={handleSearch}
              allowClear
            />
            <Select defaultValue="all" style={{ width: 120 }} onChange={handleTypeFilter}>
              <Option value="all">全部类型</Option>
              <Option value="meeting">会议室</Option>
              <Option value="training">培训室</Option>
            </Select>
            <Select defaultValue="all" style={{ width: 120 }} onChange={handleStatusFilter}>
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
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
    </>
  );
} 