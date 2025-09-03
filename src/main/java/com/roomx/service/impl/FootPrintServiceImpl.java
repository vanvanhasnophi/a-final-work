package com.roomx.service.impl;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomx.model.dto.FootPrintCreateDTO;
import com.roomx.model.dto.FootPrintDTO;
import com.roomx.model.dto.FootPrintQueryDTO;
import com.roomx.model.entity.FootPrint;
import com.roomx.repository.FootPrintRepository;
import com.roomx.service.FootPrintService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FootPrintServiceImpl implements FootPrintService {
    
    private final FootPrintRepository footPrintRepository;
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    
    // 根据CSV表定义的可见性规则
    private static final Map<String, String> ACTION_VISIBILITY = new HashMap<>();
    
    static {
        // admin 权限可见
        ACTION_VISIBILITY.put("user create", "admin");
        ACTION_VISIBILITY.put("user update", "admin");
        ACTION_VISIBILITY.put("user delete", "admin");
        ACTION_VISIBILITY.put("user password", "operator");
        
        // approver 权限可见
        ACTION_VISIBILITY.put("app submit", "approver");
        ACTION_VISIBILITY.put("app approve", "approver");
        ACTION_VISIBILITY.put("app reject", "approver");
        ACTION_VISIBILITY.put("app cancel", "none");
        ACTION_VISIBILITY.put("app close", "approver");
        ACTION_VISIBILITY.put("app delete", "admin");
        ACTION_VISIBILITY.put("app checkin", "operator"); // 申请签到操作
        
        // admin 权限可见
        ACTION_VISIBILITY.put("room create", "admin");
        ACTION_VISIBILITY.put("room update", "admin");
        ACTION_VISIBILITY.put("room delete", "admin");
        
        // approver 权限可见
        ACTION_VISIBILITY.put("duty assign", "approver");
        ACTION_VISIBILITY.put("duty create", "approver");
        ACTION_VISIBILITY.put("duty update", "approver");
        ACTION_VISIBILITY.put("duty delete", "approver");
        
        // admin 权限可见
        ACTION_VISIBILITY.put("system", "admin");
        ACTION_VISIBILITY.put("system upgrade", "admin");
    }
    
    @Override
    public FootPrintDTO createFootPrint(FootPrintCreateDTO createDTO, Long operatorId) {
        try {
            FootPrint footPrint = convertToEntity(createDTO);
            footPrint.setOperatorId(operatorId);
            footPrint.setTimestamp(new Date());
            
            FootPrint saved = footPrintRepository.save(footPrint);
            log.info("Created footprint: operator={}, action={}, target=user:{}/room:{}/app:{}", 
                    operatorId, createDTO.getAction(), createDTO.getUserId(), 
                    createDTO.getRoomId(), createDTO.getApplicationId());
                    
            return convertToDTO(saved);
        } catch (Exception e) {
            log.error("Failed to create footprint: {}", e.getMessage(), e);
            throw new RuntimeException("创建足迹记录失败", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public FootPrintDTO getFootPrintById(Long id) {
        Optional<FootPrint> footPrint = footPrintRepository.findById(id);
        if (footPrint.isPresent()) {
            return convertToDTO(footPrint.get());
        }
        throw new RuntimeException("足迹记录不存在");
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FootPrintDTO> getFootPrints(FootPrintQueryDTO queryDTO) {
        try {
            // 构建分页和排序参数
            Sort.Direction direction = Sort.Direction.fromString(queryDTO.getDirection());
            Pageable pageable = PageRequest.of(queryDTO.getPage(), queryDTO.getSize(), 
                                             Sort.by(direction, queryDTO.getSort()));
            
            // 解析时间范围
            Date startTime = null;
            Date endTime = null;
            if (queryDTO.getStartDate() != null && !queryDTO.getStartDate().isEmpty()) {
                startTime = dateFormat.parse(queryDTO.getStartDate());
            }
            if (queryDTO.getEndDate() != null && !queryDTO.getEndDate().isEmpty()) {
                endTime = dateFormat.parse(queryDTO.getEndDate());
            }
            
            // 执行查询
            Page<FootPrint> footPrints = footPrintRepository.findByConditions(
                queryDTO.getOperatorId(),
                queryDTO.getUserId(),
                queryDTO.getApplicationId(),
                queryDTO.getRoomId(),
                queryDTO.getAction(),
                startTime,
                endTime,
                pageable
            );
            
            return footPrints.map(this::convertToDTO);
        } catch (ParseException e) {
            log.error("Date parsing failed: {}", e.getMessage());
            throw new RuntimeException("日期格式错误", e);
        } catch (Exception e) {
            log.error("Query footprints failed: {}", e.getMessage(), e);
            throw new RuntimeException("查询足迹记录失败", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FootPrintDTO> getFootPrintsByOperator(Long operatorId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<FootPrint> footPrints = footPrintRepository.findByOperatorId(operatorId, pageable);
        return footPrints.map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FootPrintDTO> getFootPrintsByUserOperations(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<FootPrint> footPrints = footPrintRepository.findByOperatorIdOrderByTimestampDesc(userId, pageable);
        return footPrints.map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FootPrintDTO> getFootPrintsByUserRelated(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<FootPrint> footPrints = footPrintRepository.findUserRelatedFootPrints(userId, pageable);
        return footPrints.map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FootPrintDTO> getFootPrintsByRoomDirect(Long roomId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<FootPrint> footPrints = footPrintRepository.findByRoomId(roomId, pageable);
        // 排除申请签到操作，但保持分页结构
        return footPrints.map(footPrint -> {
            FootPrintDTO dto = convertToDTO(footPrint);
            // 如果是申请签到操作，设置为不可见，但仍保留在结果中
            if ("app checkin".equals(dto.getAction())) {
                dto.setVisible(false);
            }
            return dto;
        });
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FootPrintDTO> getFootPrintsByRoomRelated(Long roomId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<FootPrint> footPrints = footPrintRepository.findRoomRelatedFootPrints(roomId, pageable);
        // 排除申请签到操作，但保持分页结构
        return footPrints.map(footPrint -> {
            FootPrintDTO dto = convertToDTO(footPrint);
            if ("app checkin".equals(dto.getAction())) {
                dto.setVisible(false);
            }
            return dto;
        });
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FootPrintDTO> getFootPrintsByApplication(Long applicationId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<FootPrint> footPrints = footPrintRepository.findByApplicationId(applicationId, pageable);
        // 排除申请签到操作，但保持分页结构
        return footPrints.map(footPrint -> {
            FootPrintDTO dto = convertToDTO(footPrint);
            if ("app checkin".equals(dto.getAction())) {
                dto.setVisible(false);
            }
            return dto;
        });
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FootPrintDTO> getFootPrintsByApplicationRelated(Long applicationId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<FootPrint> footPrints = footPrintRepository.findApplicationRelatedFootPrints(applicationId, pageable);
        // 排除申请签到操作，但保持分页结构
        return footPrints.map(footPrint -> {
            FootPrintDTO dto = convertToDTO(footPrint);
            if ("app checkin".equals(dto.getAction())) {
                dto.setVisible(false);
            }
            return dto;
        });
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<FootPrintDTO> getRecentFootPrints() {
        List<FootPrint> footPrints = footPrintRepository.findTop10ByOrderByTimestampDesc();
        return footPrints.stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countByOperator(Long operatorId) {
        return footPrintRepository.countByOperatorId(operatorId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countByTimeRange(Date startTime, Date endTime) {
        return footPrintRepository.countByTimestampBetween(startTime, endTime);
    }
    
    @Override
    public void deleteFootPrint(Long id) {
        try {
            if (footPrintRepository.existsById(id)) {
                footPrintRepository.deleteById(id);
                log.info("Deleted footprint with id: {}", id);
            } else {
                throw new RuntimeException("足迹记录不存在");
            }
        } catch (Exception e) {
            log.error("Failed to delete footprint: {}", e.getMessage(), e);
            throw new RuntimeException("删除足迹记录失败", e);
        }
    }
    
    @Override
    public void cleanupHistoryData(Date cutoffDate) {
        try {
            footPrintRepository.deleteByTimestampBefore(cutoffDate);
            log.info("Cleaned up footprint data before: {}", cutoffDate);
        } catch (Exception e) {
            log.error("Failed to cleanup history data: {}", e.getMessage(), e);
            throw new RuntimeException("清理历史数据失败", e);
        }
    }
    
    @Override
    public List<FootPrintDTO> createFootPrintsBatch(List<FootPrintCreateDTO> createDTOs, Long operatorId) {
        try {
            List<FootPrint> footPrints = createDTOs.stream()
                    .map(dto -> {
                        FootPrint footPrint = convertToEntity(dto);
                        footPrint.setOperatorId(operatorId);
                        footPrint.setTimestamp(new Date());
                        return footPrint;
                    })
                    .collect(Collectors.toList());
            
            List<FootPrint> saved = footPrintRepository.saveAll(footPrints);
            log.info("Batch created {} footprints for operator: {}", saved.size(), operatorId);
            
            return saved.stream()
                       .map(this::convertToDTO)
                       .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to batch create footprints: {}", e.getMessage(), e);
            throw new RuntimeException("批量创建足迹记录失败", e);
        }
    }
    
    /**
     * 检查操作是否对指定权限可见
     * @param action 操作类型
     * @param userRole 用户权限（admin, approver, operator）
     * @return 是否可见
     */
    public boolean isVisibleToUser(String action, String userRole) {
        String requiredRole = ACTION_VISIBILITY.get(action);
        
        if (requiredRole == null) {
            // 未定义的操作类型，默认对所有人可见
            return true;
        }
        
        switch (requiredRole) {
            case "none":
                return false; // 对所有人不可见
            case "operator":
                return "admin".equals(userRole) || "approver".equals(userRole) || "operator".equals(userRole);
            case "approver":
                return "admin".equals(userRole) || "approver".equals(userRole);
            case "admin":
                return "admin".equals(userRole);
            default:
                return true; // 默认可见
        }
    }
    
    
    
    @Override
    public FootPrintDTO convertToDTO(FootPrint footPrint) {
        FootPrintDTO dto = new FootPrintDTO();
        BeanUtils.copyProperties(footPrint, dto);
        
        // 设置可见性标记（需要在调用时传入用户权限）
        // 这里先设置为默认可见，具体权限检查在上层方法中处理
        dto.setVisible(true);
        
        // 根据CSV规则设置操作可见性级别
        String requiredRole = ACTION_VISIBILITY.get(footPrint.getAction());
        dto.setOperator(requiredRole != null ? requiredRole : "operator"); // 默认为operator级别
        
        // 这里可以添加关联数据的查询，比如用户名、房间名等
        // 为了性能考虑，可以通过缓存或者批量查询优化
        
        return dto;
    }
       
    
    @Override
    public FootPrint convertToEntity(FootPrintCreateDTO createDTO) {
        FootPrint footPrint = new FootPrint();
        BeanUtils.copyProperties(createDTO, footPrint);
        return footPrint;
    }
}
