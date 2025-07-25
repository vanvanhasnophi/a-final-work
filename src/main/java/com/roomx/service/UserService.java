package com.roomx.service;

import com.roomx.entity.User;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.UserQuery;

public interface UserService {
    UserInfoDTO updateUserInfo(Long userId, UserInfoDTO userInfoDTO); // 具体类型可替换
    UserInfoDTO getUserInfo(Long userId); // 具体类型可替换、
    PageResult<UserInfoDTO> page(UserQuery query, int pageNum, int pageSize);
    // 其他业务方法...
}
