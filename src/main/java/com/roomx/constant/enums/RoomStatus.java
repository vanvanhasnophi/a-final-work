package com.roomx.constant.enums;

public enum RoomStatus {
    AVAILABLE(0), // 可用, 默认
    RESERVED(1), // 已预约，待签到
    USING(2), // 已签到使用
    MAINTENANCE(3), // 维修中
    CLEANING(4), // 清洁中
    PENDING_CLEANING(5), // 待清洁
    PENDING_MAINTENANCE(6), // 待维修
    UNAVAILABLE(-1); // 不可用

    private final int code;
    private RoomStatus(int code) {
        this.code = code;
    }
    public int getCode() {
        return code;
    }
}
