import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import {
    Table, Card, Button, Space, Form, Input, DatePicker, Select,
    message, Alert, Tag, Pagination, Result, Drawer, Descriptions,
    Divider, Tooltip, App, Checkbox
} from 'antd';
// import { <icon> } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { usePageRefresh } from '../hooks/usePageRefresh';
import PageErrorBoundary from '../components/PageErrorBoundary';
import ResponsiveButton from '../components/ResponsiveButton';
import ManagementPageContainer from '../components/ManagementPageContainer';
import FilterDropdownButton from '../components/FilterDropdownButton';

// import {} from '../utils/permissionUtils';
import { getRoleDisplayName } from '../utils/roleMapping';
// import { <API> } from '../api/service';
import { useI18n } from '../contexts/I18nContext';
// import { useDebounceSearchV2 } from '../hooks/useDebounceSearchV2';
import { getUserDisplayName } from '../utils/userDisplay';
import { BlurContext } from '../App';


function Content() {
    const { t } = useI18n();
    const { user } = useAuth();
    const { modal } = App.useApp();
    const { enableMoreBlur } = useContext(BlurContext);
    const [datasource, setApplications] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [searchParams, setSearchParams] = useState({
        pageNum: 1,
        pageSize: 10,
    });
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [authError, setAuthError] = useState(null);

    // 筛选控件状态
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(undefined);
    const [showExpired, setShowExpired] = useState(false);
    const datePickerRef = useRef(null);
    const statusSelectRef = useRef(null);
    const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

    // 抽屉状态
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [drawerType, setDrawerType] = useState(''); // 'detail', 'approve', 'cancel'
    const [currentApplication, setCurrentApplication] = useState(null);



    const { loading: customLoading, error: applicationsError, executeWithRetry: executeApplications } = useApiWithRetry();

    // 防抖搜索Hook
    const roomSearch = useDebounceSearchV2((value) => {
        const newParams = { roomName: value || undefined, pageNum: 1 };
        setSearchParams(prev => ({ ...prev, ...newParams }));
        fetchApplications(newParams);
    }, 500);

    const applicantSearch = useDebounceSearchV2((value) => {
        const newParams = { username: value || undefined, pageNum: 1 };
        setSearchParams(prev => ({ ...prev, ...newParams }));
        fetchApplications(newParams);
    }, 500);

    // 页面刷新Hook
    const handlePageRefresh = usePageRefresh(() => {
        fetchApplications();
    });

    // 获取申请列表
    
    // 初始化加载
    useEffect(() => {
        
    }, []);

    // 处理表格分页变化
    const handleTableChange = (pagination, filters, sorter) => {
        console.log('表格分页变化:', pagination);
        const newParams = {
            pageNum: pagination.current,
            pageSize: pagination.pageSize,
        };
        setSearchParams(prev => ({ ...prev, ...newParams }));
        fetchApplications(newParams);
    };

    

    // 提交表单
    const handleSubmit = async (values) => {
        
    };

    // 权限检查
    const canView = canViewAllApplications(user?.role) || canViewOwnApplications(user?.role);
    const canApprove = canApproveApplication(user?.role);
    const canCancel = canCancelApplication(user?.role);

    // 如果用户没有权限，显示权限不足页面
    if (!canView) {
        return (
            <div style={{ padding: '24px' }}>
                <Result
                    status="403"
                    title="403"
                    subTitle={t('applicationManagement.auth.result403Subtitle')}
                    extra={
                        <div>
                            <p>{t('applicationManagement.auth.result403RolePrefix')}{getRoleDisplayName(user?.role)}</p>
                            <p>{t('applicationManagement.auth.result403NeedRole')}</p>
                        </div>
                    }
                />
            </div>
        );
    }

    // 如果有认证错误，显示错误页面
    if (authError) {
        return (
            <div style={{ padding: '24px' }}>
                <Result
                    status="error"
                    title={t('applicationManagement.auth.resultErrorTitle')}
                    subTitle={authError}
                    extra={[
                        <Button key="back" onClick={() => window.history.back()}>
                            {t('applicationManagement.actions.back')}
                        </Button>,
                        <Button key="login" type="primary" onClick={() => window.location.href = '/login'}>
                            {t('applicationManagement.actions.login')}
                        </Button>
                    ]}
                />
            </div>
        );
    }

    

    const columns = [
        {
            title: t('pagename.columns.col'),
            dataIndex: 'col',
            onCell : () => ({ 'data-field': 'col' }),
            key: 'col',
            render: (param) => {
                return <div>{param}</div>;
            },
        }
    ];

    // 1. filterControls（主筛选区控件）
    const filterControls = [
        <div style={{ minWidth: '200px' }} key="room">
            <Input
                placeholder={t('pagename.filters.inputPlaceholder')}
                allowClear
                style={{ width: '100%' }}
                value={roomSearch.searchValue}
                onChange={e => {/* execute */}}
                onPressEnter={() => {/* immediately execute */}}
            />
        </div>,
        <div style={{ minWidth: '120px' }} key="status">
            <Select
                ref={statusSelectRef}
                placeholder={t('pagename.filters.statusPlaceholder')}
                allowClear
                style={{ width: '100%' }}
                value={selectedStatus}
                overlayClassName={enableMoreBlur ? 'blur-dropdown-menu' : ''}
                onChange={value => {
                    // execute
                }}
            >
                <Option value="VAL">{t('pagename.selectOptions.VAL')}</Option>
            </Select>
        </div>,
        <div style={{ minWidth: '150px' }} key="date">
            <DatePicker
                ref={datePickerRef}
                style={{ width: '100%' }}
                placeholder={t('pagename.filters.datePlaceholder')}
                format="YYYY-MM-DD"
                value={selectedDate}
                onChange={date => {
                    // execute
                }}
            />
        </div>,
        <div className="filter-checkbox" style={{ minWidth: '120px', display: 'flex', alignItems: 'center' }} key="expired">
            <Checkbox
                checked={globalBoolean}
                onChange={e => {
                    // execute
                }}
            >
                {t('pagename.filters.checkboxLabel')}
            </Checkbox>
            <Button
                key="key"
                style={{ marginLeft: 8 }}
                onClick={() => {
                    // execute
                }}
            >
                {t('pagename.filters.buttonLabel')}
            </Button>
        </div>,
    ];



    // 2. actions（常规操作按钮）
    const actions = [
        <ResponsiveButton
            icon={<ReloadOutlined />}
            onClick={() => fetchApplications()}
            loading={customLoading}
            key="refresh"
        >
            {t('common.refresh')}
        </ResponsiveButton>
    ];

    // 3. tableProps
    const tableProps = {
        columns,
        dataSource: datasource,
        rowKey: 'id',
        loading: customLoading,
        // scroll: { x: 1200, y: isFilterCollapsed ? 'calc(100vh - 251px)' : 'calc(100vh - 307px)' },
        // pagination: false,
        onChange: handleTableChange,
        size: 'middle',
        sticky: { offsetHeader: 0 },
        rowClassName: record => isApplicationExpired(record) ? 'expired-row' : ''
    };

    // 4. pageProps
    const pageProps = {
        ...pagination,
        /*
        showTotal: (total, range) => {
          const tpl = t('applicationManagement.paginationTotal');
          return tpl.replace('{from}', String(range[0])).replace('{to}', String(range[1])).replace('{total}', String(total));
        },
        */
        // pageSizeOptions: ['10', '20', '50', '100'], 默认为这个
        // size: 'default', 默认值
        /*
        onChange: (page, pageSize) => {
          const newParams = { pageNum: page, pageSize };
          setSearchParams(prev => ({ ...prev, ...newParams }));
          fetchApplications(newParams);
        },
        */
        showSizeChanger: !isFilterCollapsed,
        showQuickJumper: !isFilterCollapsed
    };

    // 5. 错误提示
    const error = CustomError && {
        title: t('pagename.error.dataFetchTitle'),
        description: String(CustomError)
    };

    return (
        <PageErrorBoundary onGoBack={handlePageRefresh}>
            {contextHolder}
            <ManagementPageContainer
                title={t('pagename.title')}
                badge={'badge'}
                actions={actions}
                filterControls={filterControls}
                filterCollapsed={isFilterCollapsed}
                onFilterCollapseChange={setIsFilterCollapsed}
                tableProps={tableProps}
                pageProps={pageProps}
                error={error}
            />
            {/* Drawer/Modal等业务弹窗 */}
        </PageErrorBoundary>
    );
}


export default function PageName() {
    return (
        <App>
            <PageName />
        </App>
    );
}