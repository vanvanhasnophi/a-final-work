package com.roomx.constant.enums;

import lombok.Getter;

@Getter
public enum AuthStatus {
    SUCCESS(0),
    FAIL(1),
    USER_NOT_FOUND(2),
    PASSWORD_INCORRECT(3),
    USER_ALREADY_EXISTS(4),
    USER_NOT_LOGGED_IN(5),
    USER_NOT_AUTHORIZED(6);

    private final int code;
    AuthStatus(int code) {
        this.code = code;
    }
}
