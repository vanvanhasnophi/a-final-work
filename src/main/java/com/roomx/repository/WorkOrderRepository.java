package com.roomx.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;
import com.roomx.model.entity.WorkOrder;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    
    // 根据工单编号查询
    Optional<WorkOrder> findByOrderNo(String orderNo);
    
    // 根据提交人查询
    Page<WorkOrder> findBySubmitterId(Long submitterId, Pageable pageable);
    
    // 根据处理人查询
    Page<WorkOrder> findByAssigneeId(Long assigneeId, Pageable pageable);
    
    // 根据状态查询
    Page<WorkOrder> findByStatus(WorkOrderStatus status, Pageable pageable);
    
    // 根据类型查询
    Page<WorkOrder> findByOrderType(OrderType orderType, Pageable pageable);
    
    // 根据优先级查询
    Page<WorkOrder> findByPriority(WorkOrderPriority priority, Pageable pageable);
    
    // 根据房间查询
    Page<WorkOrder> findByRoomId(Long roomId, Pageable pageable);
    
    // 根据标签查询
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.tags LIKE %:tag%")
    Page<WorkOrder> findByTag(@Param("tag") String tag, Pageable pageable);
    
    // 根据标题或描述模糊查询
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.title LIKE %:keyword% OR wo.description LIKE %:keyword%")
    Page<WorkOrder> findByTitleOrDescriptionContaining(@Param("keyword") String keyword, Pageable pageable);
    
    // 根据搜索关键词查询（性能优化）
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.searchKeywords LIKE %:keyword%")
    Page<WorkOrder> findBySearchKeywordsContaining(@Param("keyword") String keyword, Pageable pageable);
    
    // 根据是否逾期查询
    Page<WorkOrder> findByIsOverdue(Boolean isOverdue, Pageable pageable);
    
    // 根据处理时间范围查询
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.processingTimeMinutes BETWEEN :minTime AND :maxTime")
    Page<WorkOrder> findByProcessingTimeBetween(@Param("minTime") Long minTime, @Param("maxTime") Long maxTime, Pageable pageable);
    
    // 根据评论数量查询
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.commentCount >= :minCount")
    Page<WorkOrder> findByCommentCountGreaterThanEqual(@Param("minCount") Integer minCount, Pageable pageable);
    
    // 根据附件数量查询
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.attachmentCount >= :minCount")
    Page<WorkOrder> findByAttachmentCountGreaterThanEqual(@Param("minCount") Integer minCount, Pageable pageable);
    
    // 根据查看次数查询
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.viewCount >= :minCount")
    Page<WorkOrder> findByViewCountGreaterThanEqual(@Param("minCount") Integer minCount, Pageable pageable);
    
    // 根据最后活动时间查询
    Page<WorkOrder> findByLastActivityTimeBetween(Date startTime, Date endTime, Pageable pageable);
    
    // 根据自定义字段查询
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.customFields LIKE %:fieldValue%")
    Page<WorkOrder> findByCustomFieldsContaining(@Param("fieldValue") String fieldValue, Pageable pageable);
    
    // 根据创建时间范围查询
    Page<WorkOrder> findByCreateTimeBetween(Date startTime, Date endTime, Pageable pageable);
    
    // 根据更新时间范围查询
    Page<WorkOrder> findByUpdateTimeBetween(Date startTime, Date endTime, Pageable pageable);
    
    // 根据预期完成时间范围查询
    Page<WorkOrder> findByExpectedCompletionTimeBetween(Date startTime, Date endTime, Pageable pageable);
    
    // 根据实际完成时间范围查询
    Page<WorkOrder> findByActualCompletionTimeBetween(Date startTime, Date endTime, Pageable pageable);
    
    // 根据评分范围查询
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.rating BETWEEN :minRating AND :maxRating")
    Page<WorkOrder> findByRatingBetween(@Param("minRating") Integer minRating, @Param("maxRating") Integer maxRating, Pageable pageable);
    
    // 统计各状态的工单数量
    @Query("SELECT wo.status, COUNT(wo) FROM WorkOrder wo GROUP BY wo.status")
    List<Object[]> countByStatus();
    
    // 统计各类型的工单数量
    @Query("SELECT wo.orderType, COUNT(wo) FROM WorkOrder wo GROUP BY wo.orderType")
    List<Object[]> countByOrderType();
    
    // 统计各优先级的工单数量
    @Query("SELECT wo.priority, COUNT(wo) FROM WorkOrder wo GROUP BY wo.priority")
    List<Object[]> countByPriority();
    
    // 统计处理人的工单数量
    @Query("SELECT wo.assigneeId, wo.assigneeName, COUNT(wo) FROM WorkOrder wo WHERE wo.assigneeId IS NOT NULL GROUP BY wo.assigneeId, wo.assigneeName")
    List<Object[]> countByAssignee();
    
    // 统计房间的工单数量
    @Query("SELECT wo.roomId, wo.roomName, COUNT(wo) FROM WorkOrder wo WHERE wo.roomId IS NOT NULL GROUP BY wo.roomId, wo.roomName")
    List<Object[]> countByRoom();
    
    // 查询逾期的工单
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.expectedCompletionTime < :now AND wo.status NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED')")
    List<WorkOrder> findOverdueOrders(@Param("now") Date now);
    
    // 查询即将到期的工单
    @Query("SELECT wo FROM WorkOrder wo WHERE wo.expectedCompletionTime BETWEEN :startTime AND :endTime AND wo.status NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED')")
    List<WorkOrder> findUpcomingDeadlineOrders(@Param("startTime") Date startTime, @Param("endTime") Date endTime);
    
    // 统计平均处理时间
    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, wo.createTime, wo.actualCompletionTime)) FROM WorkOrder wo WHERE wo.actualCompletionTime IS NOT NULL")
    Double getAverageProcessingTime();
    
    // 统计平均评分
    @Query("SELECT AVG(wo.rating) FROM WorkOrder wo WHERE wo.rating IS NOT NULL")
    Double getAverageRating();
} 