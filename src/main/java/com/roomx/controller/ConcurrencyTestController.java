package com.roomx.controller;

import java.util.Date;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.model.dto.ApplicationDTO;
import com.roomx.service.ApplicationService;
import com.roomx.utils.ConcurrencyTestUtil;
import com.roomx.utils.ConcurrencyTestUtil.ConcurrencyTestResult;

@RestController
@RequestMapping("/api/test/concurrency")
public class ConcurrencyTestController {
    
    @Autowired
    private ApplicationService applicationService;
    
    private final AtomicInteger testCounter = new AtomicInteger(0);
    
    /**
     * 测试并发申请
     */
    @PostMapping("/test-apply")
    public ResponseEntity<ConcurrencyTestResult> testConcurrentApply(
            @RequestParam(defaultValue = "10") int threadCount,
            @RequestParam(defaultValue = "1") Long roomId,
            @RequestParam(defaultValue = "1") Long userId) {
        
        ConcurrencyTestResult result = ConcurrencyTestUtil.executeConcurrentTasks(threadCount, () -> {
            try {
                // 创建测试申请数据
                ApplicationDTO applicationDTO = new ApplicationDTO();
                applicationDTO.setUserId(userId);
                applicationDTO.setRoomId(roomId);
                applicationDTO.setReason("并发测试申请-" + testCounter.incrementAndGet());
                applicationDTO.setCrowd(10L);
                applicationDTO.setContact("test@example.com");
                applicationDTO.setStatus(com.roomx.constant.enums.ApplicationStatus.PENDING);
                
                // 设置时间（每个申请间隔1分钟）
                Date startTime = new Date(System.currentTimeMillis() + (long) testCounter.get() * 60 * 1000);
                Date endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1小时后
                applicationDTO.setStartTime(startTime);
                applicationDTO.setEndTime(endTime);
                applicationDTO.setCreateTime(new Date());
                applicationDTO.setUpdateTime(new Date());
                
                applicationService.apply(applicationDTO);
            } catch (Exception e) {
                // 记录异常但不抛出，让工具类统计
                System.err.println("并发申请测试异常: " + e.getMessage());
            }
        });
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 测试并发审批
     */
    @PostMapping("/test-approve")
    public ResponseEntity<ConcurrencyTestResult> testConcurrentApprove(
            @RequestParam(defaultValue = "5") int threadCount,
            @RequestParam Long applicationId) {
        
        ConcurrencyTestResult result = ConcurrencyTestUtil.executeConcurrentTasks(threadCount, () -> {
            try {
                applicationService.approve(applicationId, "并发测试审批");
            } catch (Exception e) {
                System.err.println("并发审批测试异常: " + e.getMessage());
            }
        });
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 获取测试统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<String> getTestStats() {
        return ResponseEntity.ok("测试计数器: " + testCounter.get());
    }
} 