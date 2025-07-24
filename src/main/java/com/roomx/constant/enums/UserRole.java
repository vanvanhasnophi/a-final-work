package com.roomx.constant.enums;

public enum UserRole {
    ADMIN(-1),// 管理员
    APPLIER(0),// 申请人
    APPROVER(1),// 审批人
    SERVICE_STAFF(2),// 服务人员
    MAINTAINER(3);// 维修人员

    private final int code;
} 