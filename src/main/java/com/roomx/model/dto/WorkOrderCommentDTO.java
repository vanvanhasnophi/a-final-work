package com.roomx.model.dto;

import java.util.Date;

import lombok.Data;

@Data
public class WorkOrderCommentDTO {
    private Long id;
    private Long workOrderId;
    private Long commenterId;
    private String commenterName;
    private String commenterRole;
    private String content;
    private String commentType;
    private String attachments;
    private Date createTime;
    private Date updateTime;
    private Boolean isInternal;
    private Long parentId;
    private Integer likeCount;
} 