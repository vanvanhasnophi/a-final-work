package com.roomx.utils;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.locks.ReentrantLock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Token验证日志记录工具类
 * 用于记录详细的token验证过程，输出到项目根目录的日志文件中
 */
public class TokenValidationLogger {
    private static final Logger logger = LoggerFactory.getLogger(TokenValidationLogger.class);
    private static final String LOG_FILE_PATH = "token_validation.log";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    private static final ReentrantLock logLock = new ReentrantLock();
    
    /**
     * 记录token验证开始
     */
    public static void logValidationStart(String requestURI, String clientIP, String userAgent) {
        String message = String.format("[%s] TOKEN_VALIDATION_START | URI: %s | IP: %s | User-Agent: %s",
                getCurrentTime(), requestURI, clientIP, userAgent);
        writeToLog(message);
        logger.info(message);
    }
    
    /**
     * 记录token验证跳过
     */
    public static void logValidationSkipped(String requestURI, String reason) {
        String message = String.format("[%s] TOKEN_VALIDATION_SKIPPED | URI: %s | Reason: %s",
                getCurrentTime(), requestURI, reason);
        writeToLog(message);
        logger.info(message);
    }
    
    /**
     * 记录token解析开始
     */
    public static void logTokenParsingStart(String tokenPrefix) {
        String message = String.format("[%s] TOKEN_PARSING_START | Token: %s...",
                getCurrentTime(), tokenPrefix);
        writeToLog(message);
        logger.debug(message);
    }
    
    /**
     * 记录token解析成功
     */
    public static void logTokenParsingSuccess(String username, String role, String expiration) {
        String message = String.format("[%s] TOKEN_PARSING_SUCCESS | Username: %s | Role: %s | Expiration: %s",
                getCurrentTime(), username, role, expiration);
        writeToLog(message);
        logger.debug(message);
    }
    
    /**
     * 记录token解析失败
     */
    public static void logTokenParsingFailure(String error, String tokenPrefix) {
        String message = String.format("[%s] TOKEN_PARSING_FAILURE | Error: %s | Token: %s...",
                getCurrentTime(), error, tokenPrefix);
        writeToLog(message);
        logger.warn(message);
    }
    
    /**
     * 记录token过期
     */
    public static void logTokenExpired(String username, String expiration) {
        String message = String.format("[%s] TOKEN_EXPIRED | Username: %s | Expiration: %s",
                getCurrentTime(), username, expiration);
        writeToLog(message);
        logger.warn(message);
    }
    
    /**
     * 记录认证设置成功
     */
    public static void logAuthenticationSet(String username, String role) {
        String message = String.format("[%s] AUTHENTICATION_SET | Username: %s | Role: %s",
                getCurrentTime(), username, role);
        writeToLog(message);
        logger.debug(message);
    }
    
    /**
     * 记录认证设置失败
     */
    public static void logAuthenticationFailed(String reason) {
        String message = String.format("[%s] AUTHENTICATION_FAILED | Reason: %s",
                getCurrentTime(), reason);
        writeToLog(message);
        logger.warn(message);
    }
    
    /**
     * 记录token验证完成
     */
    public static void logValidationComplete(String requestURI, boolean success, String details) {
        String message = String.format("[%s] TOKEN_VALIDATION_COMPLETE | URI: %s | Success: %s | Details: %s",
                getCurrentTime(), requestURI, success, details);
        writeToLog(message);
        logger.info(message);
    }
    
    /**
     * 记录token生成
     */
    public static void logTokenGeneration(String username, String role, String expiration) {
        String message = String.format("[%s] TOKEN_GENERATION | Username: %s | Role: %s | Expiration: %s",
                getCurrentTime(), username, role, expiration);
        writeToLog(message);
        logger.info(message);
    }
    
    /**
     * 记录token验证统计
     */
    public static void logValidationStats(String username, String requestURI, long durationMs) {
        String message = String.format("[%s] TOKEN_VALIDATION_STATS | Username: %s | URI: %s | Duration: %dms",
                getCurrentTime(), username, requestURI, durationMs);
        writeToLog(message);
        logger.debug(message);
    }
    
    /**
     * 记录token验证失败
     */
    public static void logValidationFailed(String requestURI, String reason) {
        String message = String.format("[%s] TOKEN_VALIDATION_FAILED | URI: %s | Reason: %s",
                getCurrentTime(), requestURI, reason);
        writeToLog(message);
        logger.warn(message);
    }
    
    /**
     * 记录token验证成功
     */
    public static void logValidationSuccess(String requestURI, String username, long durationMs) {
        String message = String.format("[%s] TOKEN_VALIDATION_SUCCESS | URI: %s | Username: %s | Duration: %dms",
                getCurrentTime(), requestURI, username, durationMs);
        writeToLog(message);
        logger.debug(message);
    }

    /**
     * 记录异常情况
     */
    public static void logException(String operation, String error, String details) {
        String message = String.format("[%s] TOKEN_VALIDATION_EXCEPTION | Operation: %s | Error: %s | Details: %s",
                getCurrentTime(), operation, error, details);
        writeToLog(message);
        logger.error(message);
    }
    
    /**
     * 获取当前时间字符串
     */
    private static String getCurrentTime() {
        return LocalDateTime.now().format(DATE_FORMATTER);
    }
    
    /**
     * 写入日志文件
     */
    @SuppressWarnings("ResultOfMethodCallIgnored")
    private static void writeToLog(String message) {
        logLock.lock();
        try {
            File logFile = new File(LOG_FILE_PATH);
            File parentDir = logFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }
            
            try (PrintWriter writer = new PrintWriter(new FileWriter(logFile, true))) {
                writer.println(message);
                writer.flush();
            } catch (IOException e) {
                logger.error("Failed to write to token validation log file: {}", e.getMessage());
            }
        } finally {
            logLock.unlock();
        }
    }
} 