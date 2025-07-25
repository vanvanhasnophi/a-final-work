package com.roomx.service;

import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.UserQuery;
import com.roomx.model.dto.UserInfoDTO;

public interface UserService {
    UserInfoDTO updateUserInfo(Long userId, UserInfoDTO userInfoDTO); // 具体类型可替换
    UserInfoDTO getUserInfo(Long userId); // 具体类型可替换
    UserInfoDTO getUserInfoByUsername(String username); // 具体类型可替换
    PageResult<UserInfoDTO> page(UserQuery query, int pageNum, int pageSize);
    // 其他业务方法...
}
