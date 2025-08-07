package com.roomx.constant.enums;

import lombok.Getter;

@Getter
public enum RoomType {
    SEMINAR_ROOM(1), // 研讨间
    CASE_ROOM(2), // 案例教室
    LECTURE_ROOM(3), // 平面教室
    LAB_ROOM(4), // 实验室
    OTHER_ROOM(0); // 其他

    private final int code;
    RoomType(int code) {
        this.code = code;
    }
}