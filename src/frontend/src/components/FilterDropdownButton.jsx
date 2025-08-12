import React, { useState } from 'react';
import { Dropdown, Button } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

const FilterDropdownButton = ({ 
  children, 
  visible = true,
  placement = "bottomRight",
  ...props 
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!visible) {
    return null;
  }

  return (
    <Dropdown
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      trigger={['hover']}
      placement={placement}
      dropdownRender={() => (
        <div
          style={{
            background: 'var(--component-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: 'var(--shadow)',
            minWidth: '300px',
            maxWidth: '500px',
            zIndex: 1050
          }}
        >
          {children}
        </div>
      )}
      {...props}
    >
      <Button
        type="text"
        icon={<FilterOutlined />}
        style={{
          border: 'none',
          boxShadow: 'none',
          padding: '4px 8px',
          color: 'var(--text-color)',
          background: 'transparent',
          transition: 'all 0.15s ease',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-text-hover)';
          e.currentTarget.style.transform = 'translateZ(0)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform = 'translateZ(0)';
        }}
      />
    </Dropdown>
  );
};

export default FilterDropdownButton;
