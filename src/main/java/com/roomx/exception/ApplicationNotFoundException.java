package com.roomx.exception;
 
public class ApplicationNotFoundException extends RuntimeException {
    public ApplicationNotFoundException(String msg) {
        super(msg);
    }
} 