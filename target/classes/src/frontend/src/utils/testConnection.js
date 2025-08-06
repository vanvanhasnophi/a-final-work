import api from '../api';

// 测试前后端连接
export const testConnection = async () => {
  try {
    console.log('测试前后端连接...');
    
    // 测试基础连接
    const response = await api.get('/user/me');
    console.log('连接成功:', response.data);
    return true;
  } catch (error) {
    console.error('连接失败:', error);
    return false;
  }
};

// 测试登录功能
export const testLogin = async (username, password) => {
  try {
    console.log('测试登录功能...');
    
    const response = await api.post('/login', { username, password });
    console.log('登录成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

// 测试教室列表
export const testRoomList = async () => {
  try {
    console.log('测试教室列表...');
    
    const response = await api.get('/room/page');
    console.log('教室列表:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取教室列表失败:', error);
    throw error;
  }
};

// 测试申请列表
export const testApplicationList = async () => {
  try {
    console.log('测试申请列表...');
    
    const response = await api.get('/application/list');
    console.log('申请列表:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取申请列表失败:', error);
    throw error;
  }
}; 