package com.roomx.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.roomx.model.entity.WorkOrderAttachment;

@Repository
public interface WorkOrderAttachmentRepository extends JpaRepository<WorkOrderAttachment, Long> {
    
    // 根据工单ID查询附件
    List<WorkOrderAttachment> findByWorkOrderId(Long workOrderId);
    
    // 根据评论ID查询附件
    List<WorkOrderAttachment> findByCommentId(Long commentId);
    
    // 根据上传者查询
    Page<WorkOrderAttachment> findByUploaderId(Long uploaderId, Pageable pageable);
    
    // 根据文件类型查询
    List<WorkOrderAttachment> findByFileType(String fileType);
    
    // 根据是否删除查询
    Page<WorkOrderAttachment> findByIsDeleted(Boolean isDeleted, Pageable pageable);
    
    // 根据工单ID和是否删除查询
    List<WorkOrderAttachment> findByWorkOrderIdAndIsDeleted(Long workOrderId, Boolean isDeleted);
    
    // 根据评论ID和是否删除查询
    List<WorkOrderAttachment> findByCommentIdAndIsDeleted(Long commentId, Boolean isDeleted);
    
    // 统计工单的附件数量
    @Query("SELECT COUNT(woa) FROM WorkOrderAttachment woa WHERE woa.workOrderId = :workOrderId AND woa.isDeleted = false")
    Long countByWorkOrderId(@Param("workOrderId") Long workOrderId);
    
    // 统计评论的附件数量
    @Query("SELECT COUNT(woa) FROM WorkOrderAttachment woa WHERE woa.commentId = :commentId AND woa.isDeleted = false")
    Long countByCommentId(@Param("commentId") Long commentId);
    
    // 统计上传者的附件数量
    @Query("SELECT COUNT(woa) FROM WorkOrderAttachment woa WHERE woa.uploaderId = :uploaderId AND woa.isDeleted = false")
    Long countByUploaderId(@Param("uploaderId") Long uploaderId);
    
    // 查询下载次数最多的附件
    @Query("SELECT woa FROM WorkOrderAttachment woa WHERE woa.isDeleted = false ORDER BY woa.downloadCount DESC")
    List<WorkOrderAttachment> findTopDownloadedAttachments(Pageable pageable);
    
    // 根据文件名模糊查询
    @Query("SELECT woa FROM WorkOrderAttachment woa WHERE woa.fileName LIKE %:keyword% OR woa.originalName LIKE %:keyword%")
    Page<WorkOrderAttachment> findByFileNameContaining(@Param("keyword") String keyword, Pageable pageable);
    
    // 根据文件大小范围查询
    @Query("SELECT woa FROM WorkOrderAttachment woa WHERE woa.fileSize BETWEEN :minSize AND :maxSize")
    Page<WorkOrderAttachment> findByFileSizeBetween(@Param("minSize") Long minSize, @Param("maxSize") Long maxSize, Pageable pageable);
} 