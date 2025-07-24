package com.roomx.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import com.roomx.entity.Application;
import com.roomx.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/application")
public class ApplicationController {
    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/apply") // 申请预约
    public ResponseEntity<String> apply(@RequestBody Application application) { // 申请预约
        return ResponseEntity.ok("Application submitted successfully");
    }

    @GetMapping("/list") // 获取预约列表
    public ResponseEntity<List<Application>> list() {// 获取预约列表
        return ResponseEntity.ok(applicationService.list());
    }
}
