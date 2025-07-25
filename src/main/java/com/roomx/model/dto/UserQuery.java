package com.roomx.model.dto;

import com.roomx.constant.enums.UserRole;
import com.roomx.constant.enums.ApproverPermission;
import java.util.Date;
import lombok.Data;

@Data
public class UserQuery {
    private String username;
    private String nickname;
    private String contact;
    private UserRole role;
    private Date createTime;
    private Date lastLoginTime;
    
    //optional
    private String department;
    private String skill;
    private String serviceArea;
    private ApproverPermission permission;

} 