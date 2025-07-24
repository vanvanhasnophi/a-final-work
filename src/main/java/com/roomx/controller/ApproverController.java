package com.roomx.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/approver")
public class ApproverController {
    // 审批相关接口
    @PostMapping("/approve")// 批准
    public ResponseEntity<Application> approve(@RequestBody Application application) {
        Application savedApplication = applicationService.approve(application);
        return ResponseEntity.ok(savedApplication);
    }

    @PostMapping("/reject")// 驳回
    public ResponseEntity<Application> reject(@RequestBody Application application) {
        Application savedApplication = applicationService.reject(application);
        return ResponseEntity.ok(savedApplication);
    }

    @PostMapping("/postpone")// 延期
    public ResponseEntity<Application> postpone(@RequestBody Application application) {
        Application savedApplication = applicationService.postpone(application);
        return ResponseEntity.ok(savedApplication);
    }

    @PostMapping("/suspend")// 挂起
    public ResponseEntity<Application> suspend(@RequestBody Application application) {
        Application savedApplication = applicationService.suspend(application);
        return ResponseEntity.ok(savedApplication);
    }

    @PostMapping("/cancel")// 取消
    public ResponseEntity<Application> cancel(@RequestBody Application application) {
        Application savedApplication = applicationService.cancel(application);
        return ResponseEntity.ok(savedApplication);
    }

    
    
    

}

