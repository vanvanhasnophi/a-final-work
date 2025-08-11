import { tGlobal } from '../contexts/I18nContext';

// 教室类型映射工具函数（字典驱动）
export const getRoomTypeDisplayName = (type) => {
  const key = `room.type.${type}`;
  return tGlobal(key, type || tGlobal('room.type.UNKNOWN', '未知类型'));
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
  { value: 'caseroom', label: tGlobal('room.type.CASE_ROOM', '案例教室') },
  { value: 'seminar', label: tGlobal('room.type.SEMINAR_ROOM', '研讨间') },
  { value: 'lab', label: tGlobal('room.type.LAB_ROOM', '实验室') },
  { value: 'lecture', label: tGlobal('room.type.LECTURE_ROOM', '平面教室') },
  { value: 'other', label: tGlobal('room.type.OTHER_ROOM', '其他') }
];