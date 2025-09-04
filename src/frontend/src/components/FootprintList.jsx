import React, { useState, useEffect } from 'react';
import { List, Tag, Space, Typography, Empty, Spin, Avatar } from 'antd';
import { UserOutlined, HomeOutlined, FileTextOutlined } from '@ant-design/icons';
import { formatRelativeTime } from '../utils/dateFormat';
import footprintService from '../services/footprintService';
import {
  getActionDisplayName,
  getActionIcon,
  getActionColor,
  formatFootprintDescription
} from '../utils/footprintTypes';

const { Text } = Typography;

export default function FootprintList({
  type = 'all', // 'all', 'user', 'room', 'application', 'my'
  targetId = null, // 当type为user/room/application时的目标ID
  queryType = 'operations', // 'operations', 'related'
  maxItems = 10,
  showAvatar = true,
  showTime = true,
  showType = true,
  compact = false,
  height = "400px",
  minHeight = "200px",
  emptyText = "暂无动态记录",
  autoRefresh = false,
  refreshInterval = 30000
}) {
  const [footprints, setFootprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // 获取动态数据
  const fetchFootprints = async (pageNum = 0, append = false) => {
    try {
      setLoading(!append);
      let response;

      switch (type) {
        case 'my':
          response = await footprintService.getMyFootprints(queryType, pageNum, maxItems);
          break;
        case 'user':
          if (targetId) {
            response = await footprintService.getUserFootprints(targetId, queryType, pageNum, maxItems);
          }
          break;
        case 'room':
          if (targetId) {
            response = await footprintService.getRoomFootprints(targetId, queryType, pageNum, maxItems);
          }
          break;
        case 'application':
          if (targetId) {
            response = await footprintService.getApplicationFootprints(targetId, queryType, pageNum, maxItems);
          }
          break;
        default:
          response = await footprintService.getAllFootprints(pageNum, maxItems);
          break;
      }

      if (response && response.content) {
        const newFootprints = response.content.map(fp => footprintService.formatFootprintForDisplay(fp));
        const visibleFootprints = footprintService.filterVisibleFootprints(newFootprints);
        
        if (append) {
          setFootprints(prev => [...prev, ...visibleFootprints]);
        } else {
          setFootprints(visibleFootprints);
        }
        
        setHasMore(!response.last);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取动态失败:', error);
      if (!append) {
        setFootprints([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchFootprints(0);
  }, [type, targetId, queryType]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchFootprints(0);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, type, targetId, queryType]);

  // 加载更多
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchFootprints(page + 1, true);
    }
  };

  // 获取头像
  const getAvatarByAction = (footprint) => {
    const { action } = footprint;
    const category = action.split(' ')[0];
    
    switch (category) {
      case 'user':
        return <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />;
      case 'room':
        return <Avatar size="small" icon={<HomeOutlined />} style={{ backgroundColor: '#faad14' }} />;
      case 'app':
        return <Avatar size="small" icon={<FileTextOutlined />} style={{ backgroundColor: '#52c41a' }} />;
      default:
        return <Avatar size="small" style={{ backgroundColor: '#666' }}>{getActionIcon(action)}</Avatar>;
    }
  };

  // 限制显示的动态数量
  const displayFootprints = footprints.slice(0, maxItems);

  if (loading && footprints.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin tip="正在加载动态..." />
      </div>
    );
  }

  if (!displayFootprints || displayFootprints.length === 0) {
    return (
      <Empty 
        description={emptyText}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div 
      style={{ 
        height: height, 
        minHeight: minHeight,
        overflowY: 'auto',
        marginTop: '-20px',
        marginLeft: '-20px',
        marginRight: '-20px',
        marginBottom: '-24px'
      }}
      className="custom-scrollbar"
    >
      <List
        dataSource={displayFootprints}
        loadMore={
          hasMore && displayFootprints.length >= maxItems ? (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <a onClick={loadMore} style={{ color: '#1890ff' }}>
                {loading ? '加载中...' : '加载更多'}
              </a>
            </div>
          ) : null
        }
        renderItem={(footprint) => {
          if (!footprint.visible) return null;
          
          return (
            <List.Item
              style={{
                padding: compact ? '8px 20px' : '12px 20px',
                borderBottom: compact ? 'none' : '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                {showAvatar && (
                  <div style={{ marginRight: '12px' }}>
                    {getAvatarByAction(footprint)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Space direction="vertical" size={compact ? 2 : 4} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Text 
                        strong 
                        style={{ 
                          fontSize: compact ? '13px' : '14px',
                          wordBreak: 'break-word'
                        }}
                      >
                        {formatFootprintDescription(footprint)}
                      </Text>
                      {showType && (
                        <Tag 
                          color={getActionColor(footprint.action)}
                          size={compact ? 'small' : 'default'}
                        >
                          {footprint.actionDisplay}
                        </Tag>
                      )}
                    </div>
                    
                    {footprint.tempInfo && (
                      <Text 
                        type="secondary" 
                        style={{ 
                          fontSize: compact ? '11px' : '12px',
                          wordBreak: 'break-word'
                        }}
                      >
                        {footprint.tempInfo}
                      </Text>
                    )}
                    
                    {/* 显示相关信息 */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {footprint.operatorName && (
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          操作者: {footprint.operatorName}
                        </Text>
                      )}
                      {footprint.userName && (
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          用户: {footprint.userName}
                        </Text>
                      )}
                      {footprint.roomName && (
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          房间: {footprint.roomName}
                        </Text>
                      )}
                    </div>
                  </Space>
                </div>
              </div>
              
              {showTime && footprint.timestamp && (
                <div style={{ marginLeft: '12px', textAlign: 'right', flexShrink: 0 }}>
                  <Text 
                    type="secondary" 
                    style={{ 
                      fontSize: compact ? '10px' : '12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {footprint.displayTime}
                  </Text>
                </div>
              )}
            </List.Item>
          );
        }}
      />
    </div>
  );
}
