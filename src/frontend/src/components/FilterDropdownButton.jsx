import React, { useState, useContext } from 'react';
import { Dropdown, Button } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { BlurContext } from '../App';

const FilterDropdownButton = ({ 
  children, 
  visible = true,
  placement = "bottomRight",
  ...props 
}) => {
  const enableMoreBlur = useContext(BlurContext);
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
      overlayClassName={enableMoreBlur ? 'blur-dropdown-menu' : ''}
      popupRender={() => (
        <div
          style={{
            background: enableMoreBlur ? 'var(--component-bg-allow-blur)' : 'var(--component-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: 'var(--shadow)',
            minWidth: '300px',
            maxWidth: '500px',
            zIndex: 1050,
            backdropFilter: enableMoreBlur ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: enableMoreBlur ? 'blur(16px)' : 'none',
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
