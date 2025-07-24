package com.roomx.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String msg) {
        // 用户不存在
        super(msg);
    }
}
