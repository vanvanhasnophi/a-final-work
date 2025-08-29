import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Drawer, 
  Form, 
  DatePicker, 
  Select, 
  Input, 
  message, 
  Modal, 
  Tooltip,
  Calendar,
  Avatar,
  ConfigProvider
} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { 
  DeleteOutlined, 
  ExclamationCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { dutyAPI } from '../api/duty';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { canManageUsers } from '../utils/permissionUtils';
import ResponsiveFilterContainer from '../components/ResponsiveFilterContainer';
import PageErrorBoundary from '../components/PageErrorBoundary';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function DutySchedule() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  // 根据当前语言设置Antd locale
  const antdLocale = lang === 'en-US' ? enUS : zhCN;
  const [drawerType, setDrawerType] = useState(''); // 'create', 'edit'
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [availableUsers, setAvailableUsers] = useState([]);
  const [todayDuty, setTodayDuty] = useState(null);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();
  const [isTransitioning, setIsTransitioning] = useState(false);
  // const [themeVersion, setThemeVersion] = useState(0); // 用于强制重新渲染
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function isToday(date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

  // 手动清理和重新应用今日标记的函数
  const refreshTodayMarks = useCallback(() => {
    // 只在切换月份和页面刷新时调用
      const today = dayjs();
      // 清理之前的标记
      document.querySelectorAll('.custom-today-mark').forEach(el => {
        el.remove();
      });
      // 清理之前应用的今日样式
      document.querySelectorAll('.ant-picker-calendar .ant-picker-calendar-date').forEach(cell => {
        const dateValue = cell.querySelector('.ant-picker-calendar-date-value');
        if (dateValue) {
          cell.style.background = '';
          cell.style.border = '';
          cell.style.boxShadow = '';
          dateValue.style.color = '';
          dateValue.style.fontWeight = '';
        }
      });
        // 以外层td.title为准，title为YYYY-MM-DD
        const cells = document.querySelectorAll('.ant-picker-calendar .ant-picker-calendar-date');
        cells.forEach(cell => {
          const dateValue = cell.querySelector('.ant-picker-calendar-date-value');
          if (!dateValue) return;
          // 找到外层td
          let td = cell.closest('td[title]');
          if (!td) return;
          const dateStr = td.getAttribute('title');
          if (!dateStr) return;
          const cellDate = dayjs(dateStr);
          if (
            cellDate.year() === today.year() &&
            cellDate.month() === today.month() &&
            cellDate.date() === today.date()
          ) {
            console.log('match!');
            // 检测主题模式
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
              document.documentElement.classList.contains('dark') ||
              document.body.classList.contains('dark') ||
              window.matchMedia('(prefers-color-scheme: dark)').matches;
            // 应用今日样式
            cell.style.position = 'relative';
            if (isDark) {
              cell.style.background = 'linear-gradient(135deg, rgba(179, 15, 204, 0.15), rgba(179, 15, 204, 0.08))';
              cell.style.border = '1px solid rgba(179, 15, 204, 0.4)';
              cell.style.boxShadow = '0 2px 4px rgba(179, 15, 204, 0.2)';
              dateValue.style.color = '#B30FCC';
            } else {
              cell.style.background = 'linear-gradient(135deg, rgba(102, 8, 116, 0.08), rgba(102, 8, 116, 0.04))';
              cell.style.border = '1px solid rgba(102, 8, 116, 0.3)';
              cell.style.boxShadow = '0 2px 4px rgba(102, 8, 116, 0.1)';
              dateValue.style.color = '#660874';
            }
            dateValue.style.fontWeight = 'bold';
            // 添加今日标记
            const mark = document.createElement('div');
            mark.className = 'custom-today-mark';
            mark.textContent = t('common.today', 'Today');
            mark.style.cssText = `
              position: absolute;
              top: 2px;
              right: 2px;
              background: ${isDark ? '#B30FCC' : '#660874'};
              color: white;
              font-size: ${lang === 'en-US' ? '9px' : '10px'};
              padding: 1px ${lang === 'en-US' ? '3px' : '4px'};
              border-radius: 8px;
              line-height: 1;
              font-weight: bold;
              z-index: 10;
            `;
            cell.appendChild(mark);
          }
        });
  }, [selectedDate, lang]);


  // 简化的样式设置
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* CSS变量定义 */
      :root {
        --text-color: #262626;
        --border-color: #f0f0f0;
        --today-duty-bg: #f6ffed;
        --today-duty-hover-bg: #f0f9f0;
        --today-duty-icon-color: #52c41a;
        --today-duty-title-color: #52c41a;
        --today-duty-text-color: #262626;
        --today-duty-name-color: #262626;
        --today-duty-avatar-bg: #52c41a;
        --today-duty-avatar-color: #fff;
        --today-duty-remark-color: #666;
        --today-duty-no-duty-color: #999;
        --avatar-bg-color: rgba(24, 144, 255, 0.8);
        --avatar-text-color: #fff;
        --avatar-border-color: rgba(24, 144, 255, 0.3);
      }
      
      /* 显式浅色模式支持 */
      [data-theme="light"] {
        --text-color: #262626;
        --border-color: #f0f0f0;
        --today-duty-bg: #f6ffed;
        --today-duty-hover-bg: #f0f9f0;
        --today-duty-icon-color: #52c41a;
        --today-duty-title-color: #52c41a;
        --today-duty-text-color: #262626;
        --today-duty-name-color: #1a1a1a;
        --today-duty-avatar-bg: #52c41a;
        --today-duty-avatar-color: #fff;
        --today-duty-remark-color: #666;
        --today-duty-no-duty-color: #999;
        --avatar-bg-color: rgba(24, 144, 255, 0.8);
        --avatar-text-color: #fff;
        --avatar-border-color: rgba(24, 144, 255, 0.3);
      }
      
      /* 深色模式支持 */
      @media (prefers-color-scheme: dark) {
        :root {
          --text-color: rgba(255, 255, 255, 0.85);
          --border-color: rgba(255, 255, 255, 0.15);
          --today-duty-bg: rgba(82, 196, 26, 0.15);
          --today-duty-hover-bg: rgba(82, 196, 26, 0.2);
          --today-duty-icon-color: #73d13d;
          --today-duty-title-color: #73d13d;
          --today-duty-text-color: rgba(255, 255, 255, 0.85);
          --today-duty-name-color: rgba(255, 255, 255, 0.95);
          --today-duty-avatar-bg: #73d13d;
          --today-duty-avatar-color: #000;
          --today-duty-remark-color: rgba(255, 255, 255, 0.65);
          --today-duty-no-duty-color: rgba(255, 255, 255, 0.45);
          --avatar-bg-color: rgba(105, 192, 255, 0.8);
          --avatar-text-color: #fff;
          --avatar-border-color: rgba(105, 192, 255, 0.4);
        }
      }
      
      /* 手动深色模式类支持 */
      .dark,
      [data-theme="dark"] {
        --text-color: rgba(255, 255, 255, 0.85);
        --border-color: rgba(255, 255, 255, 0.15);
        --today-duty-bg: rgba(82, 196, 26, 0.15);
        --today-duty-hover-bg: rgba(82, 196, 26, 0.2);
        --today-duty-icon-color: #73d13d;
        --today-duty-title-color: #73d13d;
        --today-duty-text-color: rgba(255, 255, 255, 0.85);
        --today-duty-name-color: rgba(255, 255, 255, 0.95);
        --today-duty-avatar-bg: #73d13d;
        --today-duty-avatar-color: #000;
        --today-duty-remark-color: rgba(255, 255, 255, 0.65);
        --today-duty-no-duty-color: rgba(255, 255, 255, 0.45);
        --avatar-bg-color: rgba(105, 192, 255, 0.8);
        --avatar-text-color: #fff;
        --avatar-border-color: rgba(105, 192, 255, 0.4);
      }
      
      /* 月份选择器文字居中 */
      .calendar-month-picker .ant-picker-input > input {
        text-align: center !important;
        font-size: 16px !important;
        font-weight: 600 !important;
      }
      
      /* 今日值班卡片样式 */
      .today-duty-card {
        cursor: default;
      }
      .today-duty-card:hover {
        background: var(--today-duty-hover-bg) !important;
      }
      
      /* 月份导航按钮基础样式 */
      .month-nav-btn {
        border: none !important;
        box-shadow: none !important;
        transition: all 0.2s ease !important;
        border-radius: 6px !important;
        width: 36px !important;
        height: 36px !important;
        min-width: 36px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .month-nav-btn .anticon {
        font-size: 14px !important;
      }
      
      /* 日历基础布局 */
      .ant-picker-calendar {
        height: auto !important;
        transition: all 0.3s ease !important;
      }
      .ant-picker-calendar .ant-picker-panel {
        border: none !important;
        background: transparent !important;
        transition: all 0.3s ease !important;
        height: 100% !important;
      }
      .ant-picker-calendar .ant-picker-date-panel {
        padding: 8px !important;
        transition: all 0.3s ease !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .ant-picker-calendar .ant-picker-content {
        height: 100% !important;
        transition: all 0.3s ease !important;
        flex: 1 !important;
      }
      .ant-picker-calendar tbody {
        height: 100% !important;
      }
      .ant-picker-calendar table {
        height: 100% !important;
        table-layout: fixed !important;
      }
      .ant-picker-calendar .ant-picker-cell {
        height: auto !important;
        min-height: 70px !important;
        padding: 2px !important;
        transition: all 0.3s ease !important;
        vertical-align: top !important;
      }
      .ant-picker-calendar tbody td {
        border-top: none !important; /* 去掉上部阴影/边框 */
        padding: 0 !important;
        transition: all 0.3s ease !important;
      }
      .ant-picker-calendar .ant-picker-calendar-date {
        height: 100% !important;
        margin: 0 !important;
        padding: 4px !important;
        border-radius: 4px !important;
        transition: all 0.3s ease !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: flex-start !important;
      }
      
      /* 今日特殊标注样式 - 使用项目紫色主题 - 多种选择器兼容 */
      .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date,
      .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date,
      .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date {
        position: relative !important;
        background: linear-gradient(135deg, rgba(102, 8, 116, 0.08), rgba(102, 8, 116, 0.04)) !important;
        border: 1px solid rgba(102, 8, 116, 0.3) !important;
        box-shadow: 0 2px 4px rgba(102, 8, 116, 0.1) !important;
      }
      .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date::before,
      .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date::before,
      .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date::before {
        content: '今日' !important;
        position: absolute !important;
        top: 2px !important;
        right: 2px !important;
        background: #660874 !important;
        color: white !important;
        font-size: 10px !important;
        padding: 1px 4px !important;
        border-radius: 8px !important;
        line-height: 1 !important;
        font-weight: bold !important;
        z-index: 10 !important;
      }
      .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date-value,
      .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date-value,
      .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date-value {
        color: #660874 !important;
        font-weight: bold !important;
      }
      
      /* 深色模式下的今日特殊标注 - 使用更亮的紫色 */
      @media (prefers-color-scheme: dark) {
        .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date,
        .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date,
        .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date {
          background: linear-gradient(135deg, rgba(179, 15, 204, 0.15), rgba(179, 15, 204, 0.08)) !important;
          border: 1px solid rgba(179, 15, 204, 0.4) !important;
          box-shadow: 0 2px 4px rgba(179, 15, 204, 0.2) !important;
        }
        .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date::before,
        .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date::before,
        .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date::before {
          background: #B30FCC !important;
          color: white !important;
        }
        .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date-value,
        .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date-value,
        .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date-value {
          color: #B30FCC !important;
        }
      }
      
      /* 手动深色模式下的今日特殊标注 */
      .dark .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date,
      .dark .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date,
      .dark .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date {
        background: linear-gradient(135deg, rgba(179, 15, 204, 0.15), rgba(179, 15, 204, 0.08)) !important;
        border: 1px solid rgba(179, 15, 204, 0.4) !important;
        box-shadow: 0 2px 4px rgba(179, 15, 204, 0.2) !important;
      }
      .dark .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date::before,
      .dark .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date::before,
      .dark .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date::before {
        background: #B30FCC !important;
        color: white !important;
      }
      .dark .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date-value,
      .dark .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date-value,
      .dark .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date-value {
        color: #B30FCC !important;
      }
      
      /* 英文环境下的今日标注 */
      [lang="en-US"] .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date::before,
      [data-lang="en-US"] .ant-picker-calendar .ant-picker-cell-today .ant-picker-calendar-date::before,
      [lang="en-US"] .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date::before,
      [data-lang="en-US"] .ant-picker-calendar .ant-picker-cell.ant-picker-cell-today .ant-picker-calendar-date::before,
      [lang="en-US"] .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date::before,
      [data-lang="en-US"] .ant-picker-calendar td.ant-picker-cell-today .ant-picker-calendar-date::before {
        content: 'Today' !important;
        font-size: 9px !important;
        padding: 1px 3px !important;
      }
      
      /* 日历过渡效果 */
      .calendar-container {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .calendar-container.transitioning {
        opacity: 0.7 !important;
        transform: scale(0.98) !important;
      }
      
      /* 取消选定日期的高亮效果 */
      .ant-picker-calendar .ant-picker-cell-selected .ant-picker-calendar-date,
      .ant-picker-calendar .ant-picker-cell-selected .ant-picker-calendar-date-today {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      .ant-picker-calendar .ant-picker-cell-selected .ant-picker-calendar-date-value {
        background: transparent !important;
        color: var(--text-color, #262626) !important;
        border: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // 动态应用今日标记
    
    
    
    // 当月份变化时重新应用
    
  }, [lang, selectedDate]); // 添加selectedDate依赖，确保月份变化时重新应用

  // 获取值班安排列表（获取整月数据）
  const fetchSchedules = useCallback(async (date = dayjs()) => {
    try {
      const startDate = date.startOf('month').format('YYYY-MM-DD');
      const endDate = date.endOf('month').format('YYYY-MM-DD');
      
      const response = await dutyAPI.getDutySchedulesByDateRange(startDate, endDate);
      setSchedules(response.data || []);
    } catch (error) {
      console.error('获取值班安排失败:', error);
      messageApi.error(t('dutySchedule.messages.fetchFail', '获取值班安排失败'));
    }
  }, [messageApi, t]);

  // 获取可值班人员列表
  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await dutyAPI.getAvailableDutyUsers();
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('获取可值班人员失败:', error);
    }
  }, []);

  // 获取今日值班人
  const fetchTodayDuty = useCallback(async () => {
    try {
      const response = await dutyAPI.getTodayDuty();
      setTodayDuty(response.data);
    } catch (error) {
      console.error('获取今日值班人失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchSchedules(selectedDate);
    fetchAvailableUsers();
    fetchTodayDuty();
  }, [fetchSchedules, fetchAvailableUsers, fetchTodayDuty, selectedDate]);

  // 根据日期获取值班安排
  const getScheduleByDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return schedules.find(schedule => schedule.dutyDate === dateStr);
  };

  // 日历单元格内容渲染
  const dateCellRender = (value) => {
    const schedule = getScheduleByDate(value);
    if (!schedule) return null;

    const displayName = schedule.dutyUserNickname || schedule.dutyUserName;
    const isCompactMode = windowWidth < 1000;
    
    // 工具提示内容
    const tooltipContent = (
      <div style={{ lineHeight: '1.5', fontFamily: 'var(--app-font-stack)' }}>
        <div style={{ fontWeight: '600' }}><strong style={{ fontWeight: '700' }}>{displayName}</strong> ({schedule.dutyUserName})</div>
        {schedule.dutyUserPhone && <div style={{ fontWeight: '500' }}>电话: <span style={{ fontWeight: '600' }}>{schedule.dutyUserPhone}</span></div>}
        {schedule.dutyUserEmail && <div style={{ fontWeight: '500' }}>邮箱: <span style={{ fontWeight: '600' }}>{schedule.dutyUserEmail}</span></div>}
        {schedule.remark && <div style={{ marginTop: '4px', color: '#999', fontWeight: '400' }}>备注: {schedule.remark}</div>}
      </div>
    );

    if (isCompactMode) {
      // 紧凑模式：显示圆形头像，整个方格为hover区域
      return (
        <div style={{ 
          height: '100%', 
          width: '100%'
        }}>
          <Tooltip title={tooltipContent} placement="top">
            <div style={{ 
              height: '100%',
              width: '100%',
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'flex-start',
              paddingTop: '6px',
              cursor: 'pointer'
            }}>
              <Avatar
                size={28}
                style={{
                  backgroundColor: 'var(--avatar-bg-color)',
                  color: 'var(--avatar-text-color)',
                  fontSize: '13px',
                  fontWeight: '700',
                  fontFamily: 'var(--app-font-stack)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '2px solid var(--avatar-border-color)'
                }}
              >
                {displayName ? displayName.charAt(0).toUpperCase() : '?'}
              </Avatar>
            </div>
          </Tooltip>
        </div>
      );
    } else {
      // 完整模式：显示详细信息
      return (
        <div style={{ 
          height: '100%', 
          width: '100%'
        }}>
          <Tooltip title={tooltipContent} placement="top">
            <div style={{ 
              padding: '3px', 
              height: '100%',
              width: '100%',
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'flex-start',
              fontSize: '12px',
              lineHeight: '1.3',
              fontFamily: 'var(--app-font-stack)',
              cursor: 'pointer'
            }}>
            <div style={{
              background: 'rgba(24, 144, 255, 0.1)',
              borderRadius: '4px',
              padding: '4px 6px',
              marginTop: '2px',
              width: '100%',
              minHeight: '45px',
              overflow: 'hidden',
              border: '1px solid rgba(24, 144, 255, 0.2)'
            }}>
              {/* 值班人员名称 */}
              <div style={{ 
                fontWeight: '700', 
                color: '#1890ff',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '2px'
              }}>
                {displayName}
              </div>
              
              {/* 联系方式 - 优先显示电话，如果没有则显示邮箱 */}
              {(schedule.dutyUserPhone || schedule.dutyUserEmail) && (
                <div style={{ 
                  color: '#666', 
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '1px'
                }}>
                  {schedule.dutyUserPhone || schedule.dutyUserEmail}
                </div>
              )}
              
              {/* 备注信息 */}
              {schedule.remark && (
                <div style={{ 
                  color: '#999', 
                  fontSize: '9px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {schedule.remark}
                </div>
              )}
            </div>
          </div>
        </Tooltip>
        </div>
      );
    }
  };

  // 月份变化处理 - 添加过渡效果
  const onPanelChange = (value, mode) => {
    if (isTransitioning) return; // 防止重复触发
    
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedDate(value);
      fetchSchedules(value);
      setIsTransitioning(false);
      // 月份切换完成后刷新今日标记
      setTimeout(() => refreshTodayMarks(), 50);
    }, 150);
  };

  // 上一月 - 添加过渡效果
  const handlePrevMonth = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const prevMonth = selectedDate.subtract(1, 'month');
    
    setTimeout(() => {
      setSelectedDate(prevMonth);
      fetchSchedules(prevMonth);
      setIsTransitioning(false);
      // 月份切换完成后刷新今日标记
      setTimeout(() => refreshTodayMarks(), 50);
    }, 150);
  };

  // 下一月 - 添加过渡效果
  const handleNextMonth = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const nextMonth = selectedDate.add(1, 'month');
    
    setTimeout(() => {
      setSelectedDate(nextMonth);
      fetchSchedules(nextMonth);
      setIsTransitioning(false);
      // 月份切换完成后刷新今日标记
      setTimeout(() => refreshTodayMarks(), 200);
    }, 150);
  };

  // 月份选择 - 添加过渡效果
  const handleMonthSelect = (value) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setMonthPickerVisible(false);
    
    setTimeout(() => {
      setSelectedDate(value);
      fetchSchedules(value);
      setIsTransitioning(false);
      // 月份切换完成后刷新今日标记
      setTimeout(() => refreshTodayMarks(), 200);
    }, 150);
  };

  // 日期选择处理
  const onSelect = (value) => {
    const schedule = getScheduleByDate(value);
    if (canManageUsers(user?.role)) {
      if (schedule) {
        handleEdit(schedule, value);
      } else {
        handleCreate(value);
      }
    }
  };

  // 打开新建抽屉
  const handleCreate = (date = selectedDate) => {
    setDrawerType('create');
    setCurrentSchedule(null);
    form.resetFields();
    form.setFieldsValue({
      dutyDate: date
    });
    setDrawerVisible(true);
  };

  // 打开编辑抽屉
  const handleEdit = (record, date = null) => {
    setDrawerType('edit');
    setCurrentSchedule(record);
    form.resetFields();
    form.setFieldsValue({
      dutyDate: date || dayjs(record.dutyDate),
      dutyUserId: record.dutyUserId || availableUsers.find(u => u.dutyUserName === record.dutyUserName)?.dutyUserId,
      remark: record.remark,
    });
    setDrawerVisible(true);
  };

  // 删除值班安排
  const handleDelete = (record) => {
    modal.confirm({
      title: t('dutySchedule.confirmDelete.title', '确认删除'),
      icon: <ExclamationCircleOutlined />,
      content: t('dutySchedule.confirmDelete.content', '确定要删除这个值班安排吗？此操作不可恢复。'),
      onOk: async () => {
        try {
          await dutyAPI.deleteDutySchedule(record.id);
          messageApi.success(t('dutySchedule.messages.deleteSuccess', '删除成功'));
          fetchSchedules(selectedDate);
          fetchTodayDuty(); // 刷新今日值班人信息
        } catch (error) {
          console.error('删除失败:', error);
          messageApi.error(t('dutySchedule.messages.deleteFail', '删除失败'));
        }
      },
    });
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setDrawerType('');
    setCurrentSchedule(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      const submitData = {
        dutyDate: values.dutyDate.format('YYYY-MM-DD') + ' 00:00:00',
        dutyUserId: values.dutyUserId,
        remark: values.remark,
      };

      if (drawerType === 'create') {
        await dutyAPI.createDutySchedule(submitData);
        messageApi.success(t('dutySchedule.messages.createSuccess', '创建成功'));
      } else if (drawerType === 'edit') {
        await dutyAPI.updateDutySchedule(currentSchedule.id, submitData);
        messageApi.success(t('dutySchedule.messages.updateSuccess', '更新成功'));
      }

      handleCloseDrawer();
      await fetchSchedules(selectedDate);
      await fetchTodayDuty(); // 刷新今日值班人信息
      setTimeout(() => refreshTodayMarks(), 200); // 值班变更后刷新今日标记
    } catch (error) {
      console.error('提交失败:', error);
      const errorMessage = error.response?.data || error.message;
      messageApi.error(errorMessage || t('dutySchedule.messages.submitFail', '提交失败'));
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'APPROVER')) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h3>{t('common.noPermission', '暂无权限访问')}</h3>
        </div>
      </Card>
    );
  }

  return (
    <ConfigProvider locale={antdLocale}>
      <PageErrorBoundary>
        {contextHolder}
        {contextHolderModal}
        <div style={{ 
          padding: '12px',
          fontFamily: 'var(--app-font-stack)',
          transition: 'font 0.2s ease'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <div>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {t('dutySchedule.title', '值班表管理')}
              </h2>
            </div>
          </div>

        {/* 主内容区域 */}
        <Card styles={{ body: { padding: '16px', height: 'calc(100vh - 115px)' } }}>
          {/* 今日值班人提示 */}
          <div 
            className="today-duty-card"
            style={{
              background: 'var(--today-duty-bg, #f6ffed)',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--app-font-stack)'
            }}
          >
            <UserOutlined 
              style={{ 
                color: 'var(--today-duty-icon-color, #52c41a)', 
                marginRight: '8px', 
                fontSize: '16px' 
              }} 
            />
            <div>
              <span style={{ 
                fontWeight: 'bold', 
                color: 'var(--today-duty-title-color, #52c41a)',
                fontSize: '14px'
              }}>
                {t('dutySchedule.todayDuty.title', '今日值班')}:
              </span>
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '13px',
                color: 'var(--today-duty-text-color, #262626)'
              }}>
                {todayDuty ? (
                  <>
                    <Avatar 
                      size="small" 
                      icon={<UserOutlined />} 
                      style={{ 
                        marginRight: '5px',
                        backgroundColor: 'var(--today-duty-avatar-bg, #52c41a)',
                        color: 'var(--today-duty-avatar-color, #fff)',
                        transform: 'scale(0.9)'
                      }}
                    />
                    <strong style={{ 
                      color: 'var(--today-duty-name-color, #262626)' 
                    }}>
                      {todayDuty.dutyUserNickname || todayDuty.dutyUserName}
                    </strong>
                    {todayDuty.remark && (
                      <span style={{ 
                        color: 'var(--today-duty-remark-color, #666)', 
                        marginLeft: '6px' 
                      }}>
                        ({todayDuty.remark})
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: 'var(--today-duty-no-duty-color, #999)' }}>
                    {t('dutySchedule.todayDuty.noDuty', '今日无人值班')}
                  </span>
                )}
              </span>
            </div>
          </div>
          
          {/* 月份选择器 - 固定不滚动 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '8px',
            borderBottom: '1px solid var(--border-color, #f0f0f0)',
            paddingBottom: '12px'
          }}>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={handlePrevMonth}
              size="large"
              disabled={isTransitioning}
              className="month-nav-btn"
              style={{ 
                opacity: isTransitioning ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
            />
            <DatePicker
              picker="month"
              value={selectedDate}
              onChange={handleMonthSelect}
              open={monthPickerVisible}
              onOpenChange={setMonthPickerVisible}
              format={lang === 'en-US' ? 'MMM YYYY' : 'YYYY年MM月'}
              allowClear={false}
              suffixIcon={null}
              placeholder={t('dutySchedule.monthPicker.placeholder', '选择月份')}
              locale={antdLocale}
              disabled={isTransitioning}
              style={{
                width: 'auto',
                minWidth: '130px',
                opacity: isTransitioning ? 0.7 : 1,
                transition: 'all 0.3s ease'
              }}
              inputReadOnly
              className="calendar-month-picker"
            />
            <Button
              type="text"
              icon={<RightOutlined />}
              onClick={handleNextMonth}
              size="large"
              disabled={isTransitioning}
              className="month-nav-btn"
              style={{ 
                opacity: isTransitioning ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          
          {/* 日历内容区域 */}
          <div 
            className={`calendar-container ${isTransitioning ? 'transitioning' : ''}`}
            data-lang={lang}
            style={{ 
              height: `calc(100vh - 305px)`,
              overflow: 'auto',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Calendar
              CellRender={dateCellRender}
              onSelect={onSelect}
              onPanelChange={onPanelChange}
              value={selectedDate}
              defaultValue={dayjs()}
              headerRender={() => null}
              locale={antdLocale}
              style={{ 
                background: 'transparent',
                minHeight: '380px',
                opacity: isTransitioning ? 0.7 : 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
          
          {/* 提示信息 */}
          <div style={{
            padding: '10px 12px',
            textAlign: 'center',
            color: 'var(--text-color, #666)',
            fontSize: '13px',
            borderTop: '1px solid var(--border-color, #f0f0f0)',
            marginTop: '12px'
          }}>
            {canManageUsers(user?.role) ? 
              t('dutySchedule.calendar.adminHint', '点击日历格子可添加或编辑值班安排') :
              t('dutySchedule.calendar.userHint', '查看值班安排')
            }
          </div>
        </Card>

        {/* 抽屉组件 */}
        <Drawer
          title={
            drawerType === 'create' 
              ? t('dutySchedule.drawer.create', '新建值班安排')
              : t('dutySchedule.drawer.edit', '编辑值班安排')
          }
          width={600}
          open={drawerVisible}
          onClose={handleCloseDrawer}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {drawerType === 'edit' && currentSchedule && (
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(currentSchedule)}
                  >
                    {t('common.delete', '删除')}
                  </Button>
                )}
              </div>
              <div>
                <Button onClick={handleCloseDrawer} style={{ marginRight: 8 }}>
                  {t('common.cancel', '取消')}
                </Button>
                <Button type="primary" onClick={() => form.submit()}>
                  {t('common.confirm', '确定')}
                </Button>
              </div>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="dutyDate"
              label={t('dutySchedule.form.dutyDate', '值班日期')}
              rules={[{ required: true, message: t('dutySchedule.form.selectDate', '请选择值班日期') }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                placeholder={t('dutySchedule.form.selectDate', '请选择值班日期')}
                format={lang === 'en-US' ? 'YYYY-MM-DD' : 'YYYY年MM月DD日'}
                locale={antdLocale}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>

            <Form.Item
              name="dutyUserId"
              label={t('dutySchedule.form.dutyUser', '值班人员')}
              rules={[{ required: true, message: t('dutySchedule.form.selectUser', '请选择值班人员') }]}
            >
              <Select
                placeholder={t('dutySchedule.form.selectUser', '请选择值班人员')}
                showSearch
                optionFilterProp="children"
              >
                {availableUsers.map(user => (
                  <Option key={user.dutyUserId} value={user.dutyUserId}>
                    {user.dutyUserNickname || user.dutyUserName} ({user.dutyUserName})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="remark"
              label={t('dutySchedule.form.remark', '备注')}
            >
              <TextArea
                rows={3}
                placeholder={t('dutySchedule.form.enterRemark', '请输入备注信息')}
              />
            </Form.Item>
          </Form>
        </Drawer>
      </div>
      </PageErrorBoundary>
    </ConfigProvider>
  );
}
