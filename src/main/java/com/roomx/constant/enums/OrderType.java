package com.roomx.constant.enums;

public enum OrderType {
    APPLICATION(1),
    MAINTENANCE(2),
    CLEANING(3),
    UPDATE_PERMISSION(4),
    SELF_DELETE(5),
    OTHER(0);

    private final int code;

    OrderType(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }

}
