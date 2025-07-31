package com.roomx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.model.dto.ApplicationDTO;
import com.roomx.service.ApplicationService;

@RestController
@RequestMapping("/api/approver")
public class ApproverController {
    @Autowired
    private ApplicationService applicationService;

    // 审批相关接口
    @PostMapping("/approve")// 批准
    public ResponseEntity<ApplicationDTO> approve(@RequestBody ApplicationDTO applicationDTO) {
        applicationService.approve(applicationDTO.getId(), applicationDTO.getReason());
        // 查询最新状态返回
        ApplicationDTO updated = applicationService.get(applicationDTO.getId());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/reject")// 驳回
    public ResponseEntity<ApplicationDTO> reject(@RequestBody ApplicationDTO applicationDTO) {
        applicationService.reject(applicationDTO.getId(), applicationDTO.getReason());
        // 查询最新状态返回
        ApplicationDTO updated = applicationService.get(applicationDTO.getId());
        return ResponseEntity.ok(updated);
    }


    @PostMapping("/cancel")
    public ResponseEntity<ApplicationDTO> cancel(@RequestBody ApplicationDTO applicationDTO) {
        applicationService.cancel(applicationDTO.getId(), applicationDTO.getReason());
        // 查询最新状态返回
        ApplicationDTO updated = applicationService.get(applicationDTO.getId());
        return ResponseEntity.ok(updated);
    }

    
    
    

}

