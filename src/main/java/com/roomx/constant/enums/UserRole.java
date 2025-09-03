package com.roomx.constant.enums;

import lombok.Getter;

@Getter
public enum UserRole {
    ADMIN(-1),// 管理员
    APPLIER(0),// 申请人
    APPROVER(1),// 审批人
    SERVICE(2),// 服务人员
    MAINTAINER(3);// 维修人员

    private final int code;
    UserRole(int code) {
        this.code = code;
    }

    public boolean canManageApplications() {
        return this == ADMIN || this == APPROVER;
    }

    public static boolean canManageApplications(UserRole role) {
        return role == ADMIN || role == APPROVER;
    }

    public boolean canViewApplications() {
        return this == ADMIN || this == APPROVER || this == APPLIER;
    }

    public static boolean canViewApplications(UserRole role) {
        return role == ADMIN || role == APPROVER || role == APPLIER;
    }

    public boolean canManageRooms() {
        return this == ADMIN || this == SERVICE || this == MAINTAINER;
    }

    public static boolean canManageRooms(UserRole role) {
        return role == ADMIN || role == SERVICE || role == MAINTAINER;
    }

    public boolean canViewDuty() {
        return this == ADMIN || this == APPROVER || this == SERVICE;
    }

    public static boolean canViewDuty(UserRole role) {
        return role == ADMIN || role == APPROVER || role == SERVICE;
    }
}