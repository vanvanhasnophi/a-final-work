package com.roomx.constant.enums;

public enum ApplicationStatus {
    PENDING(0),// 待审批
    APPROVED(1),// 已批准
    REJECTED(2),// 已驳回
    COMPLETED(3),// 已完成
    CANCELLED(-1),// 已取消
    EXPIRED(-2);// 已过期

    private final int code;
} 