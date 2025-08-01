package com.roomx.service;

import com.roomx.constant.enums.UserRole;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.UserInfoDTO;
import com.roomx.model.dto.UserQuery;

public interface UserService {
    UserInfoDTO updateUserInfo(Long userId, UserInfoDTO userInfoDTO); // 具体类型可替换
    UserInfoDTO getUserInfo(Long userId); // 具体类型可替换
    UserInfoDTO getUserInfoByUsername(String username); // 具体类型可替换
    UserRole getUserRoleByUsername(String username); // 根据用户名获取用户角色
    PageResult<UserInfoDTO> page(UserQuery query, int pageNum, int pageSize);
    
    // 检查用户是否存在
    boolean isUserExists(String username); // 检查用户是否存在
}
