import React, { useState, useEffect, useContext } from 'react';
import { Card, Alert, Space, Table, Pagination } from 'antd';
import ResponsiveFilterContainer from './ResponsiveFilterContainer';
import FilterDropdownButton from './FilterDropdownButton';

/**
 * 通用管理页容器，内置标题、操作、筛选、错误提示、主内容、分页等布局和样式。
 * 适用于ApplicationManagement、UserList、RoomList等列表管理页。
 */
// props: filterControls: ReactNode[]，filterCollapseThreshold: number
// tableProps: 传递给Table的props，tableContent: 完全自定义表格内容
// pageProps: 传递给Pagination的props，pageContent: 完全自定义分页内容
export default function ManagementPageContainer({
  title,
  actions,
  filter,
  filterControls, // 筛选控件
  filterCollapseThreshold = 1300, // 筛选区折叠阈值
  error,
  children,
  pageProps,
  pageContent,
  style,
  bodyStyle,
  cardProps = {},
  filterCollapsed = false,
  onFilterCollapseChange,
  minTableWidth = 1200,
  tableProps,
  tableContent,
  showTableScrollbar = true,
  badge,
  onClearFilters, // 可选：清空筛选回调
}) {
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // 折叠时的筛选按钮（漏斗），弹出全部筛选控件和清空按钮
  const filterDropdownBtn = filterControls ? (
    <FilterDropdownButton>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {filterControls}
        {onClearFilters && (
          <button type="button" onClick={onClearFilters} style={{ marginLeft: 8 }}>
            清空筛选
          </button>
        )}
      </div>
    </FilterDropdownButton>
  ) : null;

  return (
    <div>
      <Card
        style={{
          backgroundColor: 'var(--component-bg-allow-blur)',
          backdropFilter: 'blur(16px)',

          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 14
        }}
      >
      <Divider />
      </Card>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 18 }}>{title}</span>
            {badge && (
              <span style={{
                fontSize: 12,
                color: 'var(--text-color-secondary)',
                fontWeight: 'normal',
                backgroundColor: 'var(--fill-color-secondary)',
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid var(--border-color)'
              }}>{badge}</span>
            )}
          </div>
        }
        extra={
          <Space size={8} style={{ gap: 8, alignItems: 'center' }}>
            {filterCollapsed && filterDropdownBtn}
            {actions}
          </Space>
        }
        style={{ flex: 1, display: 'flex', flexDirection: 'column', ...style }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0, ...bodyStyle } }}
        {...cardProps}
      >
        {/* 筛选区（支持动态折叠） */}
        {filterControls ? (
          <ResponsiveFilterContainer
            threshold={filterCollapseThreshold}
            onCollapseStateChange={onFilterCollapseChange}
          >
            <div style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              padding: filterCollapsed ? '4px' : '16px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--component-bg)',
              transition: 'padding 0.3s ease'
            }}>
              {filterControls}
            </div>
          </ResponsiveFilterContainer>
        ) : filter && (
          <div style={{
            padding: filterCollapsed ? '4px' : '16px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--component-bg)',
            transition: 'padding 0.3s ease',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: 16
          }}>{filter}</div>
        )}
        {/* 错误提示 */}
        {error && (
          <Alert
            message={error.title || '数据获取失败'}
            description={error.description || String(error)}
            type="error"
            showIcon
            style={{ margin: '16px' }}
          />
        )}
        {/* 主内容区（含表格和滚动条样式） */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '0px solid var(--border-color)',
          borderRadius: '0px',
          overflow: 'hidden',
          height: '100%',
          maxHeight: '100%',
          position: 'relative',
          minHeight: 0
        }}>
          {/* 表格内容区域 */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {/* 滚动条样式 */}
            {showTableScrollbar && (
              <style>{`
              div::-webkit-scrollbar {
                height: 8px;
                background: transparent;
              }
              div::-webkit-scrollbar-track {
                background: transparent;
              }
              div::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.15);
                border-radius: 4px;
                transition: background 0.2s ease;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.25);
              }
              div {
                scrollbar-width: thin;
                scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
              }
              [data-theme="dark"] div::-webkit-scrollbar-thumb,
              .dark div::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
              }
              [data-theme="dark"] div::-webkit-scrollbar-thumb:hover,
              .dark div::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.35);
              }
              [data-theme="dark"] div,
              .dark div {
                scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
              }
              @media (prefers-color-scheme: dark) {
                div::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.2);
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.35);
                }
                div {
                  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
                }
              }
              [data-theme="light"] div::-webkit-scrollbar-thumb,
              .light div::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.15);
              }
              [data-theme="light"] div::-webkit-scrollbar-thumb:hover,
              .light div::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.25);
              }
              [data-theme="light"] div,
              .light div {
                scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
              }
            `}</style>
            )}
            {/* 表格插槽（如有） */}
            {tableContent ? (
              <div style={{ overflowX: 'auto', overflowY: 'hidden', height: '100%' }}>
                {tableContent}
              </div>
            ) : tableProps ? (
              <div style={{ overflowX: 'auto', overflowY: 'hidden', height: '100%' }}>
                <Table
                  scroll={tableProps?.scroll ?? { x: 1200, y: isFilterCollapsed ? 'calc(100vh - 219px)' : 'calc(100vh - 275px)' }}
                  pagination={false}
                  size={tableProps?.size ?? 'middle'}
                  overflowX='hidden'
                  sticky={{ offsetHeader: 0 }}

                  {...tableProps}

                  style={{
                    minWidth: minTableWidth,
                    height: '100%',

                    ...tableProps.style
                  }}
                />
              </div>
            ) : (
              children
            )}
          </div>
          {/* 分页区（支持插槽和折叠联动） */}
          {(pageContent || pageProps) && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--component-bg)',
              display: 'flex',
              justifyContent: 'center',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px',// 可恶
              fontFamily: 'var(--app-font-stack)',
              transition: 'padding 0.3s ease',
              ...(pageProps && pageProps.isCollapsed ? { padding: '4px 8px' } : {})
            }}>
              {pageContent ? pageContent : (
                <Pagination
                  {...pageProps}
                  size='default'
                  pageSizeOptions={pageProps?.pageSizeOptions ?? ['10', '20', '50', '100']}
                  showSizeChanger={pageProps?.showSizeChanger ?? !isFilterCollapsed}
                  showQuickJumper={pageProps?.showQuickJumper ?? !isFilterCollapsed}
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}