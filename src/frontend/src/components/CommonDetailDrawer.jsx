// 通用详情抽屉组件 - 减少重复的抽屉代码
import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider } from 'antd';

const CommonDetailDrawer = ({
  // 基础属性
  visible,
  onClose,
  title,
  width = 400,
  
  // 数据和配置
  data,
  fieldConfig = [],
  
  // 操作按钮
  actions = [],
  
  // 布局配置
  descriptionsProps = {},
  
  // 自定义内容
  headerExtra,
  children,
  footerExtra
}) => {
  const renderFieldValue = (field, value) => {
    if (field.render) {
      return field.render(value, data);
    }
    
    if (field.type === 'tag' && value) {
      return <Tag color={field.color}>{value}</Tag>;
    }
    
    if (field.type === 'status' && value) {
      const color = field.getColor ? field.getColor(value) : 'default';
      return <Tag color={color}>{value}</Tag>;
    }
    
    if (field.type === 'datetime' && value) {
      const formatter = field.formatter || (v => v);
      return <span className="num-mono">{formatter(value)}</span>;
    }
    
    return value || '-';
  };

  return (
    <Drawer
      title={title}
      width={width}
      placement="right"
      onClose={onClose}
      open={visible}
      extra={headerExtra}
    >
      {data && (
        <>
          <Descriptions
            bordered
            column={1}
            size="small"
            {...descriptionsProps}
          >
            {fieldConfig.map(field => (
              <Descriptions.Item 
                key={field.key} 
                label={field.label}
                span={field.span}
              >
                {renderFieldValue(field, data[field.key])}
              </Descriptions.Item>
            ))}
          </Descriptions>
          
          {children}
          
          {(actions.length > 0 || footerExtra) && (
            <>
              <Divider />
              <div style={{ textAlign: 'right' }}>
                <Space>
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      type={action.type}
                      icon={action.icon}
                      onClick={action.onClick}
                      loading={action.loading}
                    >
                      {action.text}
                    </Button>
                  ))}
                  {footerExtra}
                </Space>
              </div>
            </>
          )}
        </>
      )}
    </Drawer>
  );
};

export default CommonDetailDrawer;
