// 通用的列表操作Hooks - 减少大型组件中的重复逻辑
import { useState, useRef, useEffect, useCallback } from 'react';
import { message } from 'antd';

// 通用列表管理Hook
export const useListManagement = (initialParams = {}) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    pageNum: 1,
    pageSize: 20,
    ...initialParams
  });

  const updateSearchParams = useCallback((newParams) => {
    setSearchParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const resetToFirstPage = useCallback(() => {
    setSearchParams(prev => ({ ...prev, pageNum: 1 }));
  }, []);

  return {
    data, setData,
    total, setTotal,
    loading, setLoading,
    searchParams, setSearchParams,
    updateSearchParams,
    resetToFirstPage
  };
};

// 通用筛选管理Hook
export const useFilterManagement = () => {
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterResetKey, setFilterResetKey] = useState(0);
  
  // 筛选项状态
  const [filters, setFilters] = useState({});
  const filtersRef = useRef({});

  // 保持ref与state同步
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setFilterResetKey(prev => prev + 1);
  }, []);

  const toggleFilterCollapse = useCallback(() => {
    setIsFilterCollapsed(prev => !prev);
  }, []);

  return {
    isFilterCollapsed, setIsFilterCollapsed, toggleFilterCollapse,
    isFiltering, setIsFiltering,
    filterResetKey, setFilterResetKey,
    filters, setFilters, filtersRef,
    updateFilter, resetFilters
  };
};

// 通用抽屉管理Hook
export const useDrawerManagement = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'add', 'detail', 'edit', 'apply'
  const [currentItem, setCurrentItem] = useState(null);

  const openDrawer = useCallback((type, item = null) => {
    setDrawerType(type);
    setCurrentItem(item);
    setDrawerVisible(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false);
    setDrawerType('');
    setCurrentItem(null);
  }, []);

  return {
    drawerVisible, setDrawerVisible,
    drawerType, setDrawerType,
    currentItem, setCurrentItem,
    openDrawer, closeDrawer
  };
};

// 通用表单管理Hook
export const useFormManagement = (formConfigs = []) => {
  const [forms, setForms] = useState({});

  useEffect(() => {
    // 为每个表单配置创建Form实例
    const formInstances = {};
    formConfigs.forEach(config => {
      if (config.name && !forms[config.name]) {
        formInstances[config.name] = Form.useForm()[0];
      }
    });
    
    if (Object.keys(formInstances).length > 0) {
      setForms(prev => ({ ...prev, ...formInstances }));
    }
  }, [formConfigs]);

  const getForm = useCallback((formName) => {
    return forms[formName];
  }, [forms]);

  const resetForm = useCallback((formName) => {
    const form = forms[formName];
    if (form) {
      form.resetFields();
    }
  }, [forms]);

  const resetAllForms = useCallback(() => {
    Object.values(forms).forEach(form => {
      if (form && form.resetFields) {
        form.resetFields();
      }
    });
  }, [forms]);

  return {
    forms,
    getForm,
    resetForm,
    resetAllForms
  };
};

// 通用消息提示Hook
export const useMessageHandler = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showSuccess = useCallback((content) => {
    messageApi.success(content);
  }, [messageApi]);

  const showError = useCallback((content) => {
    messageApi.error(content);
  }, [messageApi]);

  const showWarning = useCallback((content) => {
    messageApi.warning(content);
  }, [messageApi]);

  const showInfo = useCallback((content) => {
    messageApi.info(content);
  }, [messageApi]);

  const showLoading = useCallback((content = '处理中...') => {
    return messageApi.loading(content);
  }, [messageApi]);

  return {
    contextHolder,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };
};
