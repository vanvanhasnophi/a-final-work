package com.roomx.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import com.roomx.model.entity.Application;
import com.roomx.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/application")
public class ApplicationController {
    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/post") // 申请预约
    public ResponseEntity<Application> apply(@RequestBody Application application) {
        Application savedApplication = applicationService.apply(application);
        return ResponseEntity.ok(savedApplication);
    }

    @GetMapping("/list") // 获取全部预约列表
    public ResponseEntity<List<Application>> list() {
        return ResponseEntity.ok(applicationService.list());
    }

    @GetMapping("/user/{userId}") // 按用户ID获取预约列表
    public ResponseEntity<List<Application>> listByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(applicationService.listByUser(userId));
    }

    @GetMapping("/room/{roomId}") // 按房间ID获取预约列表
    public ResponseEntity<List<Application>> listByRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(applicationService.listByRoom(roomId));
    }

    @GetMapping("/{id}") // 获取预约详情
    public ResponseEntity<Application> get(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.get(id));
    }
}
