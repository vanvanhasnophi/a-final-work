package com.roomx.controller;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.model.dto.FootPrintCreateDTO;
import com.roomx.model.dto.FootPrintDTO;
import com.roomx.model.dto.FootPrintQueryDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.service.FootPrintService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/footprint")
@RequiredArgsConstructor
public class FootPrintController {
    
    private final FootPrintService footPrintService;
    
    @PostMapping
    public ResponseEntity<FootPrintDTO> createFootPrint(
            @RequestBody FootPrintCreateDTO createDTO,
            @RequestHeader(value = "X-User-Id", required = false) Long operatorId) {
        
        // 如果没有传入operatorId，设置默认值（实际项目中应该从JWT token中获取）
        if (operatorId == null) {
            operatorId = 1L; 
        }
        
        FootPrintDTO result = footPrintService.createFootPrint(createDTO, operatorId);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<FootPrintDTO> getFootPrint(@PathVariable Long id) {
        FootPrintDTO result = footPrintService.getFootPrintById(id);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping
    public ResponseEntity<PageResult<FootPrintDTO>> getFootPrints(FootPrintQueryDTO queryDTO) {
        Page<FootPrintDTO> page = footPrintService.getFootPrints(queryDTO);
        
        // 转换为 PageResult
        PageResult<FootPrintDTO> result = new PageResult<>();
        result.setRecords(page.getContent());
        result.setTotal(page.getTotalElements());
        result.setPageNum(queryDTO.getPage());
        result.setPageSize(queryDTO.getSize());
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/operator/{operatorId}")
    public ResponseEntity<PageResult<FootPrintDTO>> getFootPrintsByOperator(
            @PathVariable Long operatorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<FootPrintDTO> pageResult = footPrintService.getFootPrintsByOperator(operatorId, page, size);
        
        PageResult<FootPrintDTO> result = new PageResult<>();
        result.setRecords(pageResult.getContent());
        result.setTotal(pageResult.getTotalElements());
        result.setPageNum(page);
        result.setPageSize(size);
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<PageResult<FootPrintDTO>> getFootPrintsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "operations") String type) {
        
        Page<FootPrintDTO> pageResult;
        
        // 根据 type 参数决定查询类型
        if ("related".equals(type)) {
            // 获取用户相关的所有记录（包括操作的+被操作的+相关申请的）
            pageResult = footPrintService.getFootPrintsByUserRelated(userId, page, size);
        } else {
            // 默认只获取用户主动操作的记录
            pageResult = footPrintService.getFootPrintsByUserOperations(userId, page, size);
        }
        
        PageResult<FootPrintDTO> result = new PageResult<>();
        result.setRecords(pageResult.getContent());
        result.setTotal(pageResult.getTotalElements());
        result.setPageNum(page);
        result.setPageSize(size);
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/room/{roomId}")
    public ResponseEntity<PageResult<FootPrintDTO>> getFootPrintsByRoom(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "direct") String type) {
        
        Page<FootPrintDTO> pageResult;
        
        // 根据 type 参数决定查询类型
        if ("related".equals(type)) {
            // 获取房间相关的所有记录（包括直接操作+相关申请）
            pageResult = footPrintService.getFootPrintsByRoomRelated(roomId, page, size);
        } else {
            // 默认只获取对房间的直接操作
            pageResult = footPrintService.getFootPrintsByRoomDirect(roomId, page, size);
        }
        
        PageResult<FootPrintDTO> result = new PageResult<>();
        result.setRecords(pageResult.getContent());
        result.setTotal(pageResult.getTotalElements());
        result.setPageNum(page);
        result.setPageSize(size);
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/application/{applicationId}")
    public ResponseEntity<PageResult<FootPrintDTO>> getFootPrintsByApplication(
            @PathVariable Long applicationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "direct") String type) {
        
        Page<FootPrintDTO> pageResult;
        
        // 根据 type 参数决定查询类型
        if ("related".equals(type)) {
            // 获取申请相关的所有记录（包括申请操作+涉及用户操作+涉及房间操作）
            pageResult = footPrintService.getFootPrintsByApplicationRelated(applicationId, page, size);
        } else {
            // 默认只获取申请的直接操作
            pageResult = footPrintService.getFootPrintsByApplication(applicationId, page, size);
        }
        
        PageResult<FootPrintDTO> result = new PageResult<>();
        result.setRecords(pageResult.getContent());
        result.setTotal(pageResult.getTotalElements());
        result.setPageNum(page);
        result.setPageSize(size);
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/recent")
    public ResponseEntity<List<FootPrintDTO>> getRecentFootPrints() {
        List<FootPrintDTO> result = footPrintService.getRecentFootPrints();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/count/operator/{operatorId}")
    public ResponseEntity<Long> countByOperator(@PathVariable Long operatorId) {
        long count = footPrintService.countByOperator(operatorId);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/count/timerange")
    public ResponseEntity<Long> countByTimeRange(
            @RequestParam String startTime,
            @RequestParam String endTime) throws ParseException {
        
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Date start = sdf.parse(startTime);
        Date end = sdf.parse(endTime);
        
        long count = footPrintService.countByTimeRange(start, end);
        return ResponseEntity.ok(count);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFootPrint(@PathVariable Long id) {
        footPrintService.deleteFootPrint(id);
        return ResponseEntity.ok("删除成功");
    }
    
    @PostMapping("/batch")
    public ResponseEntity<List<FootPrintDTO>> createFootPrintsBatch(
            @RequestBody List<FootPrintCreateDTO> createDTOs,
            @RequestHeader(value = "X-User-Id", required = false) Long operatorId) {
        
        if (operatorId == null) {
            operatorId = 1L;
        }
        
        List<FootPrintDTO> result = footPrintService.createFootPrintsBatch(createDTOs, operatorId);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/cleanup")
    public ResponseEntity<String> cleanupHistoryData(@RequestParam String cutoffTime) throws ParseException {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Date cutoffDate = sdf.parse(cutoffTime);
        
        footPrintService.cleanupHistoryData(cutoffDate);
        return ResponseEntity.ok("清理成功");
    }
}
