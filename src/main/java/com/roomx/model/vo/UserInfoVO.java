package com.roomx.model.vo;

import com.roomx.constant.enums.ApproverPermission;
import com.roomx.constant.enums.UserRole;
import lombok.Data; 


@Data
public class UserInfoVO {
    private Long id;
    private String username;
    private String nickname;
    private String contact;
    private UserRole role;
    private ApproverPermission permission;
    private String department;
    private String skill;
    private String serviceArea;
} 



