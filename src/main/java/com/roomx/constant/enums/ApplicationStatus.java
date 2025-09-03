package com.roomx.constant.enums;

import lombok.Getter;

@Getter
public enum ApplicationStatus {
    PENDING(0),// 待审批
    APPROVED(1),// 已批准
    REJECTED(2),// 已驳回
    COMPLETED(3),// 已完成
    CANCELLED(-1),// 已取消
    PENDING_CHECKIN(4),// 待签到
    IN_USE(5);// 使用中

    private final int code;
    ApplicationStatus(int code) {
        this.code = code;
    }

    public boolean isFinished() {
        return this == REJECTED || this == COMPLETED || this == CANCELLED;
    }

    public static boolean isFinished(ApplicationStatus status) {
        return status == REJECTED || status == COMPLETED || status == CANCELLED;
    }

    public boolean isPending() {
        return this == PENDING || this == PENDING_CHECKIN;
    }

    public static boolean isPending(ApplicationStatus status) {
        return status == PENDING || status == PENDING_CHECKIN;
    }

}