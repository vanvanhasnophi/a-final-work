package com.roomx.model.entity;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "work_order_attachment")
public class WorkOrderAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 关联的工单
    @Column(name = "work_order_id", nullable = false)
    private Long workOrderId;
    
    // 关联的评论（可选）
    @Column(name = "comment_id")
    private Long commentId;
    
    // 文件信息
    @Column(name = "file_name", nullable = false, length = 200)
    private String fileName;
    
    @Column(name = "original_name", length = 200)
    private String originalName;
    
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "file_type", length = 100)
    private String fileType;
    
    @Column(name = "mime_type", length = 100)
    private String mimeType;
    
    // 上传者信息
    @Column(name = "uploader_id", nullable = false)
    private Long uploaderId;
    
    @Column(name = "uploader_name", length = 100)
    private String uploaderName;
    
    // 时间信息
    @Column(name = "upload_time", nullable = false)
    private Date uploadTime;
    
    // 文件描述
    @Column(name = "description", length = 500)
    private String description;
    
    // 是否删除
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    // 下载次数
    @Column(name = "download_count")
    private Integer downloadCount = 0;

    // JPA关联
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", referencedColumnName = "id", insertable = false, updatable = false)
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", referencedColumnName = "id", insertable = false, updatable = false)
    private WorkOrderComment comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User uploader;

    // 构造函数
    public WorkOrderAttachment() {
        this.uploadTime = new Date();
    }
    
    // 同步上传者信息
    public void syncUploaderInfo(User user) {
        if (user != null) {
            this.uploaderId = user.getId();
            this.uploaderName = user.getUsername();
        }
    }
    
    // 增加下载次数
    public void incrementDownloadCount() {
        this.downloadCount = (this.downloadCount == null ? 0 : this.downloadCount) + 1;
    }
} 