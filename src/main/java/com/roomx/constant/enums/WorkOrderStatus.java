package com.roomx.constant.enums;

public enum WorkOrderStatus {
    PENDING(0),// 待处理
    IN_PROGRESS(1),// 处理中
    COMPLETED(2),// 已完成
    CANCELLED(-1),// 已取消
    REJECTED(-2);// 已驳回

    private final int code;
    private WorkOrderStatus(int code) {
        this.code = code;
    }
    public int getCode() {
        return code;
    }
} 