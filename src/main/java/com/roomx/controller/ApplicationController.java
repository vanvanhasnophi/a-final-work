package com.roomx.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.model.dto.ApplicationDTO;
import com.roomx.model.dto.ApplicationQuery;
import com.roomx.model.dto.PageResult;
import com.roomx.service.ApplicationService;

@RestController
@RequestMapping("/api/application")
public class ApplicationController {
    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/post") // 申请预约
    public ResponseEntity<ApplicationDTO> apply(@RequestBody ApplicationDTO applicationDTO) {
        ApplicationDTO savedApplication = applicationService.apply(applicationDTO);
        return ResponseEntity.ok(savedApplication);
    }

    @GetMapping("/page") // 分页查询预约列表
    public ResponseEntity<PageResult<ApplicationDTO>> page(ApplicationQuery query,
                                                          @RequestParam(defaultValue = "1") int pageNum,
                                                          @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<ApplicationDTO> pageResult = applicationService.page(query, pageNum, pageSize);
        return ResponseEntity.ok(pageResult);
    }

    @GetMapping("/list") // 获取全部预约列表
    public ResponseEntity<List<ApplicationDTO>> list() {
        PageResult<ApplicationDTO> pageResult = applicationService.page(new ApplicationQuery(), 1, Integer.MAX_VALUE);
        return ResponseEntity.ok(pageResult.getRecords());
    }

    @GetMapping("/{id}") // 获取预约详情
    public ResponseEntity<ApplicationDTO> get(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.get(id));
    }
}
