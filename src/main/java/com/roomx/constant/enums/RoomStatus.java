package com.roomx.constant.enums;

import lombok.Getter;

@Getter
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
    RoomStatus(int code) {
        this.code = code;
    }

    public boolean onCleaning() {
        return this == CLEANING|| this == PENDING_CLEANING;
    }

    public static boolean onCleaning(RoomStatus status) {
        return status == CLEANING|| status == PENDING_CLEANING;
    }

    public boolean onMaintenance() {
        return this == MAINTENANCE || this == PENDING_MAINTENANCE;
    }

    public static boolean onMaintenance(RoomStatus status) {
        return status == MAINTENANCE || status == PENDING_MAINTENANCE;
    }

    public boolean isOccupied() {
        return this == RESERVED || this == USING;
    }

    public static boolean isOccupied(RoomStatus status) {
        return status == RESERVED || status == USING;
    }

    public boolean canApply() {
        return this != UNAVAILABLE && this != PENDING_CLEANING && this != PENDING_MAINTENANCE;
    }

    public static boolean canApply(RoomStatus status) {
        return status != UNAVAILABLE && status != PENDING_CLEANING && status != PENDING_MAINTENANCE;
    }

}
