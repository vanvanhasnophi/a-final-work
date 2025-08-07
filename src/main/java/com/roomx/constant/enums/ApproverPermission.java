package com.roomx.constant.enums;

import lombok.Getter;

@Getter
public enum ApproverPermission {
    READ_ONLY(-3),// 只读
    RESTRICTED(-1),// 受限
    NORMAL(0), // 正常
    EXTENDED(1);// 扩展

    private final int code;
    ApproverPermission(int code) {
        this.code = code;
    }
}