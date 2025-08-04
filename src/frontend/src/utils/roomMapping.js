// 教室类型映射工具函数
export const getRoomTypeDisplayName = (type) => {
  const typeMapping = {
    'CASE_ROOM': '案例教室',
    'SEMINAR_ROOM': '研讨间',
    'LAB_ROOM': '实验室',
    'LECTURE_ROOM': '平面教室',
    'OTHER_ROOM': '其他'
  };
  return typeMapping[type] || type || '未知类型';
};

// 前端值到后端枚举值的映射
export const getRoomTypeEnumValue = (frontendValue) => {
  const enumMapping = {
    'caseroom': 'CASE_ROOM',
    'seminar': 'SEMINAR_ROOM',
    'lab': 'LAB_ROOM',
    'lecture': 'LECTURE_ROOM',
    'other': 'OTHER_ROOM'
  };
  return enumMapping[frontendValue] || frontendValue;
};

// 后端枚举值到前端值的映射
export const getRoomTypeFrontendValue = (enumValue) => {
  const frontendMapping = {
    'CASE_ROOM': 'caseroom',
    'SEMINAR_ROOM': 'seminar',
    'LAB_ROOM': 'lab',
    'LECTURE_ROOM': 'lecture',
    'OTHER_ROOM': 'other'
  };
  return frontendMapping[enumValue] || enumValue;
};

// 教室类型选项（用于表单）
export const roomTypeOptions = [
  { value: 'caseroom', label: '案例教室' },
  { value: 'seminar', label: '研讨间' },
  { value: 'lab', label: '实验室' },
  { value: 'lecture', label: '平面教室' },
  { value: 'other', label: '其他' }
]; 