package com.roomx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.repository.UserRepository;
import com.roomx.repository.RoomRepository;
import com.roomx.repository.ApplicationRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    /**
     * 基础健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        response.put("service", "RoomX");
        response.put("version", "2.1.0801");
        
        return ResponseEntity.ok(response);
    }

    /**
     * 数据库健康检查
     */
    @GetMapping("/health/db")
    public ResponseEntity<Map<String, Object>> databaseHealth() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 测试数据库连接
            entityManager.createNativeQuery("SELECT 1").getSingleResult();
            
            // 获取基本统计信息
            long userCount = userRepository.count();
            long roomCount = roomRepository.count();
            long applicationCount = applicationRepository.count();
            
            response.put("status", "UP");
            response.put("database", "MySQL");
            response.put("userCount", userCount);
            response.put("roomCount", roomCount);
            response.put("applicationCount", applicationCount);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(503).body(response);
        }
    }

    /**
     * 详细健康检查
     */
    @GetMapping("/health/detailed")
    public ResponseEntity<Map<String, Object>> detailedHealth() {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> components = new HashMap<>();
        
        // 检查数据库
        try {
            entityManager.createNativeQuery("SELECT 1").getSingleResult();
            components.put("database", Map.of("status", "UP"));
        } catch (Exception e) {
            components.put("database", Map.of("status", "DOWN", "error", e.getMessage()));
        }
        
        // 检查内存
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        components.put("memory", Map.of(
            "status", "UP",
            "total", totalMemory,
            "used", usedMemory,
            "free", freeMemory,
            "usagePercent", (double) usedMemory / totalMemory * 100
        ));
        
        // 检查磁盘
        try {
            java.io.File file = new java.io.File(".");
            long totalSpace = file.getTotalSpace();
            long freeSpace = file.getFreeSpace();
            long usedSpace = totalSpace - freeSpace;
            
            components.put("disk", Map.of(
                "status", "UP",
                "total", totalSpace,
                "used", usedSpace,
                "free", freeSpace,
                "usagePercent", (double) usedSpace / totalSpace * 100
            ));
        } catch (Exception e) {
            components.put("disk", Map.of("status", "DOWN", "error", e.getMessage()));
        }
        
        response.put("status", "UP");
        response.put("components", components);
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
} 