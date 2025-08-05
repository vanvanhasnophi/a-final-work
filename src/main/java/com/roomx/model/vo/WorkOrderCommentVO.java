package com.roomx.model.vo;

import java.util.Date;

import lombok.Data;

@Data
public class WorkOrderCommentVO {
    private Long id;
    private Long workOrderId;
    private Long commenterId;
    private String commenterName;
    private String commenterRole;
    private String content;
    private String commentType;
    private String attachments;
    private Date createTime;
    private String createTimeStr;
    private Date updateTime;
    private String updateTimeStr;
    private Boolean isInternal;
    private Long parentId;
    private Integer likeCount;
    
    // 扩展字段
    private String commentTypeDesc;
    private String avatar;
    private Boolean canEdit;
    private Boolean canDelete;
} 