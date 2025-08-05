package com.roomx.model.dto;

import java.util.Date;

import lombok.Data;

@Data
public class WorkOrderAttachmentDTO {
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
    private String description;
    private Boolean isDeleted;
    private Integer downloadCount;
} 