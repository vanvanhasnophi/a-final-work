package com.roomx.utils;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 并发测试工具类
 * 用于测试并发场景下的数据一致性
 */
public class ConcurrencyTestUtil {
    
    /**
     * 并发执行任务并统计结果
     * @param taskCount 任务数量
     * @param task 要执行的任务
     * @return 执行结果统计
     */
    public static ConcurrencyTestResult executeConcurrentTasks(int taskCount, Runnable task) {
        ExecutorService executor = Executors.newFixedThreadPool(taskCount);
        CountDownLatch latch = new CountDownLatch(taskCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        AtomicReference<Exception> lastException = new AtomicReference<>();
        
        for (int i = 0; i < taskCount; i++) {
            executor.submit(() -> {
                try {
                    task.run();
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                    lastException.set(e);
                } finally {
                    latch.countDown();
                }
            });
        }
        
        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            executor.shutdown();
        }
        
        return new ConcurrencyTestResult(successCount.get(), failureCount.get(), lastException.get());
    }
    
    /**
     * 并发测试结果
     */
    public static class ConcurrencyTestResult {
        private final int successCount;
        private final int failureCount;
        private final Exception lastException;
        
        public ConcurrencyTestResult(int successCount, int failureCount, Exception lastException) {
            this.successCount = successCount;
            this.failureCount = failureCount;
            this.lastException = lastException;
        }
        
        public int getSuccessCount() {
            return successCount;
        }
        
        public int getFailureCount() {
            return failureCount;
        }
        
        public Exception getLastException() {
            return lastException;
        }
        
        public int getTotalCount() {
            return successCount + failureCount;
        }
        
        public double getSuccessRate() {
            return getTotalCount() > 0 ? (double) successCount / getTotalCount() : 0.0;
        }
        
        @Override
        public String toString() {
            return String.format("ConcurrencyTestResult{total=%d, success=%d, failure=%d, successRate=%.2f%%}", 
                getTotalCount(), successCount, failureCount, getSuccessRate() * 100);
        }
    }
} 