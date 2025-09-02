// 通用列表筛选组件 - 减少重复的筛选器代码
import React from 'react';
import { Button, Input, Select, Space, Collapse } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Option } = Select;

const CommonListFilters = ({
  // 筛选配置
  filterConfig = [],
  
  // 筛选状态
  isFilterCollapsed = true,
  onToggleCollapse,
  
  // 搜索相关
  onSearch,
  onReset,
  searchPlaceholder = '搜索...',
  
  // 按钮状态
  loading = false,
  
  // 样式
  className = '',
  
  // 子组件
  children
}) => {
  const renderFilterItem = (config) => {
    const { type, key, placeholder, options = [], ...props } = config;
    
    switch (type) {
      case 'input':
        return (
          <Input
            key={key}
            placeholder={placeholder}
            {...props}
          />
        );
      
      case 'select':
        return (
          <Select
            key={key}
            placeholder={placeholder}
            allowClear
            style={{ minWidth: 120 }}
            {...props}
          >
            {options.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
      
      case 'custom':
        return config.component;
      
      default:
        return null;
    }
  };

  return (
    <div className={`common-list-filters ${className}`}>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          {/* 主搜索框 */}
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={onSearch}
            style={{ width: 250 }}
          />
          
          {/* 筛选按钮 */}
          {filterConfig.length > 0 && (
            <Button onClick={onToggleCollapse}>
              {isFilterCollapsed ? '展开筛选' : '收起筛选'}
            </Button>
          )}
          
          {/* 重置按钮 */}
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            重置
          </Button>
          
          {/* 自定义按钮 */}
          {children}
        </Space>
      </div>
      
      {/* 高级筛选面板 */}
      {filterConfig.length > 0 && (
        <Collapse 
          activeKey={isFilterCollapsed ? [] : ['filters']} 
          ghost
          onChange={() => onToggleCollapse?.()}
        >
          <Panel header="高级筛选" key="filters">
            <Space wrap>
              {filterConfig.map(renderFilterItem)}
            </Space>
          </Panel>
        </Collapse>
      )}
    </div>
  );
};

export default CommonListFilters;
