package com.roomx.service;

import java.util.Date;
import java.util.List;

import org.springframework.data.domain.Page;

import com.roomx.model.dto.FootPrintCreateDTO;
import com.roomx.model.dto.FootPrintDTO;
import com.roomx.model.dto.FootPrintQueryDTO;
import com.roomx.model.entity.FootPrint;

public interface FootPrintService {
    
    /**
     * 创建动态记录
     */
    FootPrintDTO createFootPrint(FootPrintCreateDTO createDTO, Long operatorId);
    
    /**
     * 根据ID获取动态记录
     */
    FootPrintDTO getFootPrintById(Long id);
    
    /**
     * 分页查询动态记录
     */
    Page<FootPrintDTO> getFootPrints(FootPrintQueryDTO queryDTO);
    
    /**
     * 根据操作人ID获取记录
     */
    Page<FootPrintDTO> getFootPrintsByOperator(Long operatorId, int page, int size);
    
    /**
     * 根据用户ID获取记录 - 只获取用户主动操作的记录
     */
    Page<FootPrintDTO> getFootPrintsByUserOperations(Long userId, int page, int size);
    
    /**
     * 根据用户ID获取相关的所有记录（包括用户操作的+被操作的+相关申请的）
     */
    Page<FootPrintDTO> getFootPrintsByUserRelated(Long userId, int page, int size);
    
    /**
     * 根据房间ID获取记录 - 只获取对房间的直接操作
     */
    Page<FootPrintDTO> getFootPrintsByRoomDirect(Long roomId, int page, int size);
    
    /**
     * 根据房间ID获取相关的所有记录（包括直接操作+相关申请）
     */
    Page<FootPrintDTO> getFootPrintsByRoomRelated(Long roomId, int page, int size);
    
    /**
     * 根据应用ID获取记录
     */
    Page<FootPrintDTO> getFootPrintsByApplication(Long applicationId, int page, int size);
    
    /**
     * 根据申请ID获取相关的所有记录（包括申请操作+涉及用户操作+涉及房间操作）
     */
    Page<FootPrintDTO> getFootPrintsByApplicationRelated(Long applicationId, int page, int size);
    
    /**
     * 获取最近的操作记录
     */
    List<FootPrintDTO> getRecentFootPrints();
    
    /**
     * 统计操作人的操作次数
     */
    long countByOperator(Long operatorId);
    
    /**
     * 统计时间范围内的操作次数
     */
    long countByTimeRange(Date startTime, Date endTime);
    
    /**
     * 删除动态记录
     */
    void deleteFootPrint(Long id);
    
    /**
     * 清理历史数据（删除指定时间之前的记录）
     */
    void cleanupHistoryData(Date cutoffDate);
    
    /**
     * 批量创建动态记录
     */
    List<FootPrintDTO> createFootPrintsBatch(List<FootPrintCreateDTO> createDTOs, Long operatorId);
    
    /**
     * 实体转DTO
     */
    FootPrintDTO convertToDTO(FootPrint footPrint);
    
    /**
     * DTO转实体
     */
    FootPrint convertToEntity(FootPrintCreateDTO createDTO);
}
