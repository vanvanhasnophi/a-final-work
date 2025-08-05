package com.roomx.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;
import com.roomx.model.entity.WorkOrderStats;

@Repository
public interface WorkOrderStatsRepository extends JpaRepository<WorkOrderStats, Long> {
    
    // 根据统计日期查询
    Page<WorkOrderStats> findByStatsDate(Date statsDate, Pageable pageable);
    
    // 根据统计类型查询
    Page<WorkOrderStats> findByStatsType(String statsType, Pageable pageable);
    
    // 根据工单类型查询
    Page<WorkOrderStats> findByOrderType(OrderType orderType, Pageable pageable);
    
    // 根据工单状态查询
    Page<WorkOrderStats> findByStatus(WorkOrderStatus status, Pageable pageable);
    
    // 根据工单优先级查询
    Page<WorkOrderStats> findByPriority(WorkOrderPriority priority, Pageable pageable);
    
    // 根据处理人查询
    Page<WorkOrderStats> findByAssigneeId(Long assigneeId, Pageable pageable);
    
    // 根据房间查询
    Page<WorkOrderStats> findByRoomId(Long roomId, Pageable pageable);
    
    // 根据统计日期范围查询
    Page<WorkOrderStats> findByStatsDateBetween(Date startDate, Date endDate, Pageable pageable);
    
    // 根据统计类型和日期范围查询
    Page<WorkOrderStats> findByStatsTypeAndStatsDateBetween(String statsType, Date startDate, Date endDate, Pageable pageable);
    
    // 根据工单类型和日期范围查询
    Page<WorkOrderStats> findByOrderTypeAndStatsDateBetween(OrderType orderType, Date startDate, Date endDate, Pageable pageable);
    
    // 根据处理人和日期范围查询
    Page<WorkOrderStats> findByAssigneeIdAndStatsDateBetween(Long assigneeId, Date startDate, Date endDate, Pageable pageable);
    
    // 根据房间和日期范围查询
    Page<WorkOrderStats> findByRoomIdAndStatsDateBetween(Long roomId, Date startDate, Date endDate, Pageable pageable);
    
    // 统计各统计类型的数量
    @Query("SELECT ws.statsType, COUNT(ws) FROM WorkOrderStats ws GROUP BY ws.statsType")
    List<Object[]> countByStatsType();
    
    // 统计各工单类型的数量
    @Query("SELECT ws.orderType, COUNT(ws) FROM WorkOrderStats ws GROUP BY ws.orderType")
    List<Object[]> countByOrderType();
    
    // 统计各工单状态的数量
    @Query("SELECT ws.status, COUNT(ws) FROM WorkOrderStats ws GROUP BY ws.status")
    List<Object[]> countByStatus();
    
    // 统计各工单优先级的数量
    @Query("SELECT ws.priority, COUNT(ws) FROM WorkOrderStats ws GROUP BY ws.priority")
    List<Object[]> countByPriority();
    
    // 统计处理人的数量
    @Query("SELECT ws.assigneeId, ws.assigneeName, COUNT(ws) FROM WorkOrderStats ws WHERE ws.assigneeId IS NOT NULL GROUP BY ws.assigneeId, ws.assigneeName")
    List<Object[]> countByAssignee();
    
    // 统计房间的数量
    @Query("SELECT ws.roomId, ws.roomName, COUNT(ws) FROM WorkOrderStats ws WHERE ws.roomId IS NOT NULL GROUP BY ws.roomId, ws.roomName")
    List<Object[]> countByRoom();
    
    // 查询平均处理时间最高的统计
    @Query("SELECT ws FROM WorkOrderStats ws ORDER BY ws.avgProcessingTime DESC")
    List<WorkOrderStats> findTopProcessingTimeStats(Pageable pageable);
    
    // 查询平均评分最高的统计
    @Query("SELECT ws FROM WorkOrderStats ws ORDER BY ws.avgRating DESC")
    List<WorkOrderStats> findTopRatingStats(Pageable pageable);
    
    // 查询完成率最高的统计
    @Query("SELECT ws FROM WorkOrderStats ws WHERE ws.totalCount > 0 ORDER BY (ws.completedCount * 1.0 / ws.totalCount) DESC")
    List<WorkOrderStats> findTopCompletionRateStats(Pageable pageable);
    
    // 查询满意度率最高的统计
    @Query("SELECT ws FROM WorkOrderStats ws WHERE (ws.satisfactionCount + ws.dissatisfactionCount) > 0 ORDER BY (ws.satisfactionCount * 1.0 / (ws.satisfactionCount + ws.dissatisfactionCount)) DESC")
    List<WorkOrderStats> findTopSatisfactionRateStats(Pageable pageable);
} 