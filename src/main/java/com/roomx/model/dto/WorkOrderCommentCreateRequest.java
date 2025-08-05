package com.roomx.model.dto;

import java.util.List;

import lombok.Data;

@Data
public class WorkOrderCommentCreateRequest {
    private Long workOrderId;
    private String content;
    private String commentType;
    private List<String> attachments;
    private Boolean isInternal;
    private Long parentId;
} 