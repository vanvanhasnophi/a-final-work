package com.roomx.model.vo;

import java.util.Date;

import lombok.Data;

@Data
public class WorkOrderAttachmentVO {
    private Long id;
    private Long workOrderId;
    private Long commentId;
    private String fileName;
    private String originalName;
    private String filePath;
    private Long fileSize;
    private String fileType;
    private String mimeType;
    private Long uploaderId;
    private String uploaderName;
    private Date uploadTime;
    private String uploadTimeStr;
    private String description;
    private Boolean isDeleted;
    private Integer downloadCount;
    
    // 扩展字段
    private String fileSizeStr;
    private String downloadUrl;
    private String previewUrl;
    private Boolean canDownload;
    private Boolean canDelete;
} 