package com.roomx.exception;

/**
 * 并发修改异常
 * 当多个用户同时操作同一资源时抛出此异常
 */
public class ConcurrentModificationException extends RuntimeException {
    
    public ConcurrentModificationException(String message) {
        super(message);
    }
    
    public ConcurrentModificationException(String message, Throwable cause) {
        super(message, cause);
    }
} 