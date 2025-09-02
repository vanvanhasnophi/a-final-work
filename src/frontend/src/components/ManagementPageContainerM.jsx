import React, { useRef, useCallback, useState, useEffect, useContext,useMemo, useLayoutEffect } from 'react';
import { theme, List, Divider, Skeleton} from 'antd';
import { FilterOutlined, FilterFilled, } from '@ant-design/icons';
import { useI18n } from '../contexts/I18nContext';
import { BlurContext } from '../App';
import InfiniteScroll from 'react-infinite-scroll-component';


/**
 * 通用管理页容器，内置标题、操作、筛选、错误提示、主内容、分页等布局和样式。
 * 适用于ApplicationManagement、UserList、RoomList等列表管理页。
 */
// props: filterControls: ReactNode[]，filterCollapseThreshold: number
// tableProps: 传递给Table的props，tableContent: 完全自定义表格内容
// pageProps: 传递给Pagination的props，pageContent: 完全自定义分页内容
export default function ManagementPageContainerM({
  actions,
  filterControls, // 筛选控件
  filterThreshold, // 筛选区折叠阈值
  children,
  style,
  ListProps,
  ListContent,
  totalValue,
  expiredSuffix = '', // 过期数据后缀文本
  fetchMore,
  handleViewDetail,
  listItemBody,
  lengthOfData,
  setFloatContent, // 向上层Layout传递悬浮内容
  searchParams, // 搜索参数
  isFilterCollapsed, // 筛选折叠状态
  onToggleFilter, // 切换筛选函数
  isFiltering, // 是否处于筛选状态
}) {
  const [, setRerender] = useState(0);
  const enableMoreBlur = useContext(BlurContext);
  const { t } = useI18n();
  const [isNarrow, setIsNarrow] = useState(false);

  const {token} = theme.useToken();
  
  const [floatKey, setFloatKey] = useState(0);


  // 浮动卡片内容 useMemo（只显示总数，无分页控件）
  const floatContent = React.useMemo(() => (
    <div key={floatKey} style={{
      width: 'calc(100vw - 24px)',
      marginTop: 'calc(2vw + 68px)',
      marginLeft: '12px',
      marginRight: '12px',
      background: enableMoreBlur ? 'var(--component-bg-allow-blur)' : 'var(--component-bg)',
      backdropFilter: enableMoreBlur ? 'blur(32px)' : 'none',
      border: '1px solid var(--border-color)',
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      padding: 0,
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', gap: '0px', flexWrap: 'wrap', alignItems: 'flex-end' ,margin:'12px'}}>
        <div style={{ width: '100%' }}>
          <div style={{
            padding: '6px',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            fontFamily: 'var(--app-font-stack)'
          }}>
            <span style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 16
            }}>
              {isFiltering&&t('common.filterResultTip','筛选结果：')}{t('pagination.totalSimple', '{total} 条').replace('{total}', totalValue || 0)}{expiredSuffix}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'nowrap' }}>
              <div
                onClick={onToggleFilter}
                style={{
                  marginTop: '4px',
                  marginBottom: '4px',
                  height: '24px',
                  width: '24px',
                  fontSize: '16px',
                  display: 'flex',
                  borderRadius: '4px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  boxShadow: 'none',
                  marginLeft: 0,
                  marginRight: 0,
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, width 0.15s ease, transform 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = token.colorBgTextHover;
                  e.currentTarget.style.transform = 'translateZ(0)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.transform = 'translateZ(0)';
                }}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') onToggleFilter && onToggleFilter();
                }}
                aria-label={t('common.showFilters', '显示筛选')}
              >
                {isFilterCollapsed ? 
                  <FilterOutlined style={{ 
                    fontSize: '16px', 
                    color: isFiltering ? token.colorPrimary : token.colorText, 
                    verticalAlign: 'middle' 
                  }} /> : 
                  <FilterFilled style={{ 
                    fontSize: '16px', 
                    color: isFiltering ? token.colorPrimary : token.colorText, 
                    verticalAlign: 'middle' 
                  }} />}
              </div>
              {actions}
            </div>
          </div>
        </div>
        <div style={{
          overflow: 'hidden',
          maxHeight: isFilterCollapsed ? '0px' : '100vh',
          transition: 'max-height 0.07s ease-in-out, opacity 0.2s ease-in-out, margin 0.2s ease-in-out',
          opacity: isFilterCollapsed ? 0 : 1,
          pointerEvents: isFilterCollapsed ? 'none' : 'auto',
          // 安全措施：确保隐藏时无法通过键盘访问
          visibility: isFilterCollapsed ? 'hidden' : 'visible',
          // 防止在隐藏状态下被屏幕阅读器读取
          'aria-hidden': isFilterCollapsed,
          // 折叠时去除所有边距，确保不占用额外空间，并添加过渡动画
          margin: isFilterCollapsed ? '0' : '12px 0 0 0',
          padding: '0'
        }}>
          <Divider style={{ 
            margin: '0', 
            borderColor: 'var(--divider-color)',
            // 折叠时的过渡效果：透明度和缩放同时进行
            opacity: isFilterCollapsed ? 0 : 1,
            transform: isFilterCollapsed ? 'scaleY(0)' : 'scaleY(1)',
            transition: 'opacity 0.1s ease-in-out, transform 0.1s ease-in-out',
            transformOrigin: 'center',
            // 折叠时完全隐藏分割线（避免占用空间）
            display: isFilterCollapsed ? 'none' : 'block'
          }} />
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            flexWrap: 'wrap', 
            alignItems: 'flex-end',
            paddingTop: isFilterCollapsed ? '0' : '16px',
            paddingBottom: isFilterCollapsed ? '0' : '4px',
            // 折叠时移除所有边距
            margin: isFilterCollapsed ? '0' : undefined,
            transition: 'padding 0.1s ease-out, margin 0.1s ease-out'
          }}>
            {filterControls}
          </div>
        </div>
      </div>
    </div >
  ), [floatKey, totalValue, isFilterCollapsed, filterControls, onToggleFilter, actions, isFiltering, t, token, enableMoreBlur]);

  // 使用 useLayoutEffect 和 ref 避免无限循环，同时保留立即更新功能
  const floatContentRef = useRef(floatContent);
  floatContentRef.current = floatContent;
  
  // 为了检测 actions 的变化（特别是 loading 状态），我们序列化 actions 的关键属性
  const actionsKey = useMemo(() => {
    if (!actions || !Array.isArray(actions)) return '';
    return actions.map((action, index) => {
      const loading = action?.props?.loading || false;
      return `${index}-${loading}`;
    }).join('|');
  }, [actions]);
  
  useLayoutEffect(() => {
    if (setFloatContent) {
      setFloatContent(floatContentRef.current);
    }
    
    // 清理函数：组件卸载时清除悬浮内容
    return () => {
      if (setFloatContent) {
        setFloatContent(null);
      }
    };
  }, [setFloatContent, floatKey, totalValue, isFilterCollapsed, filterControls?.length, isFiltering, actionsKey]);


  // 无限滚动相关
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageNum, setPageNum] = useState(2); // 从第2页开始，因为第1页已经加载
  const listRef = useRef(null);
  
  // 使用 ref 存储状态避免 useCallback 依赖循环
  const loadingMoreRef = useRef(loadingMore);
  const hasMoreRef = useRef(hasMore);
  loadingMoreRef.current = loadingMore;
  hasMoreRef.current = hasMore;

  // 使用 ref 存储 searchParams，避免频繁更新
  const searchParamsRef = useRef(searchParams);
  if (searchParamsRef.current !== searchParams) {
    searchParamsRef.current = searchParams;
  }

  // 初始化时设置正确的 hasMore 状态
  useEffect(() => {
    const initialHasMore = totalValue > 0 && lengthOfData > 0 && lengthOfData < totalValue;
    console.log('初始化 hasMore 状态:', { totalValue, lengthOfData, initialHasMore });
    
    // 使用函数式更新，避免在依赖数组中包含 hasMore
    setHasMore(prevHasMore => {
      if (prevHasMore !== initialHasMore) {
        return initialHasMore;
      }
      return prevHasMore;
    });
  }, [totalValue, lengthOfData]);

  // 加载更多函数（追加数据）
  const loadMore = useCallback(async () => {
    const currentLoadingMore = loadingMoreRef.current;
    const currentHasMore = hasMoreRef.current;
    
    console.log('尝试 loadMore:', { currentLoadingMore, currentHasMore, lengthOfData, totalValue });
    // 如果当前没有任何数据，不再尝试加载更多
    if (lengthOfData === 0) {
      console.log('loadMore 跳过: 没有初始数据');
      setHasMore(false);
      return;
    }
    
    if (currentLoadingMore || !currentHasMore) {
      console.log('loadMore 跳过:', { currentLoadingMore, currentHasMore, lengthOfData, totalValue });
      return;
    }
    
    console.log('loadMore 开始:', { pageNum, lengthOfData, totalValue });
    setLoadingMore(true);
    try {
      const currentSearchParams = searchParamsRef.current;
      const pageSize = (currentSearchParams && currentSearchParams.pageSize) || 20;
      const result = await fetchMore({ pageNum, pageSize }, true); // 追加模式
      
      console.log('loadMore 结果:', result);
      if (result && result.records && Array.isArray(result.records) && result.records.length > 0) {
        setPageNum(prev => prev + 1); // 准备下一页
        // 重新计算是否还有更多数据
        const newTotal = lengthOfData + result.records.length;
        const newHasMore = newTotal < (result.total || totalValue);
        console.log('更新状态:', { newTotal, resultTotal: result.total, newHasMore });
        setHasMore(newHasMore);
      } else {
        console.log('没有更多数据');
        setHasMore(false); // 没有更多数据
      }
    } catch (error) {
      console.error('加载更多数据失败:', error);
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [pageNum, fetchMore, lengthOfData, totalValue]); // 移除 loadingMore 和 hasMore 避免循环

  // 当数据变化时重新计算是否还有更多数据
  useEffect(() => {
    const newHasMore = totalValue > 0 && lengthOfData > 0 && lengthOfData < totalValue;
    
    // 使用函数式更新，避免在依赖项中包含 hasMore
    setHasMore(prevHasMore => {
      if (prevHasMore !== newHasMore) {
        console.log('数据变化更新 hasMore:', { lengthOfData, totalValue, newHasMore, prevHasMore });
        return newHasMore;
      }
      return prevHasMore;
    });
  }, [lengthOfData, totalValue]);

  // 用 useMemo 来稳定搜索参数的引用
  const searchParamsKey = useMemo(() => {
    return `${searchParams?.pageNum || 1}-${searchParams?.username || ''}-${searchParams?.nickname || ''}-${searchParams?.role || ''}`;
  }, [searchParams?.pageNum, searchParams?.username, searchParams?.nickname, searchParams?.role]);

  // 当搜索参数变化时重置分页状态
  useEffect(() => {
    console.log('搜索参数变化，重置状态:', searchParams);
    setPageNum(2); // 重置到第2页
    setLoadingMore(false); // 重置加载状态
  }, [searchParamsKey]);

  // 渲染列表项（只显示重要内容，点击可查看详情）
  const renderItem = (item) => (
    <List.Item
      key={item.id}
      style={{ cursor: 'pointer', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}
      onClick={() => handleViewDetail(item)}
    >
      {listItemBody(item)}
    </List.Item>
  );

  const filterOverflowThreshold = filterControls ? (filterThreshold || 940) : 10000;

  const filterHeight = isFilterCollapsed ? 0 : (12 + 46 * Math.ceil(filterOverflowThreshold / window.innerWidth)); // 粗略估算高度

  return (
    
      <div
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            border: '0px solid var(--border-color)',
            borderRadius: '0px',
            overflow: 'hidden',
            height: '100%',
            position: 'relative',
            ...style
          }}>

          <div
            id="management-page-scrollable-div"
            style={{
              overflowX: 'auto',
              overflowY: 'auto',
              height: '100%'
            }}
          >
            <InfiniteScroll
              dataLength={lengthOfData}
              next={loadMore}
              hasMore={hasMore}
              loader={<Skeleton style={{ padding: '12px' }} paragraph={{ rows: 1 }} active />}
              endMessage={<div style={{ textAlign: 'center', padding: 12, color: '#bbb' }}>{t('common.noMore', '没有了')}</div>}
              scrollableTarget="management-page-scrollable-div"
              style={{ overflow: 'visible' }}
            >
              {ListContent ? ListContent : ListProps ? (
                <List
                  {...ListProps}
                  ref={listRef}
                  style={{ marginTop: isFilterCollapsed ? '96px' : `calc(104px + ${filterHeight}px )`, background: 'var(--component-bg)', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', ...ListProps.style }}
                  renderItem={renderItem}
                />
              ) : (
                children
              )}
            </InfiniteScroll>
          </div>
        </div>
      </div>
  );
}
