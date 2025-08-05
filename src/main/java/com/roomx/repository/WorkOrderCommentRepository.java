package com.roomx.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.roomx.model.entity.WorkOrderComment;

@Repository
public interface WorkOrderCommentRepository extends JpaRepository<WorkOrderComment, Long> {
    
    // 根据工单ID查询评论
    Page<WorkOrderComment> findByWorkOrderId(Long workOrderId, Pageable pageable);
    
    // 根据工单ID和评论类型查询
    Page<WorkOrderComment> findByWorkOrderIdAndCommentType(Long workOrderId, String commentType, Pageable pageable);
    
    // 根据评论人查询
    Page<WorkOrderComment> findByCommenterId(Long commenterId, Pageable pageable);
    
    // 根据父评论ID查询回复
    List<WorkOrderComment> findByParentId(Long parentId);
    
    // 根据是否内部评论查询
    Page<WorkOrderComment> findByIsInternal(Boolean isInternal, Pageable pageable);
    
    // 根据工单ID和是否内部评论查询
    Page<WorkOrderComment> findByWorkOrderIdAndIsInternal(Long workOrderId, Boolean isInternal, Pageable pageable);
    
    // 统计工单的评论数量
    @Query("SELECT COUNT(woc) FROM WorkOrderComment woc WHERE woc.workOrderId = :workOrderId")
    Long countByWorkOrderId(@Param("workOrderId") Long workOrderId);
    
    // 统计评论人的评论数量
    @Query("SELECT COUNT(woc) FROM WorkOrderComment woc WHERE woc.commenterId = :commenterId")
    Long countByCommenterId(@Param("commenterId") Long commenterId);
    
    // 查询点赞数最多的评论
    @Query("SELECT woc FROM WorkOrderComment woc WHERE woc.workOrderId = :workOrderId ORDER BY woc.likeCount DESC")
    List<WorkOrderComment> findTopLikedComments(@Param("workOrderId") Long workOrderId, Pageable pageable);
    
    // 根据内容模糊查询
    @Query("SELECT woc FROM WorkOrderComment woc WHERE woc.content LIKE %:keyword%")
    Page<WorkOrderComment> findByContentContaining(@Param("keyword") String keyword, Pageable pageable);
} 