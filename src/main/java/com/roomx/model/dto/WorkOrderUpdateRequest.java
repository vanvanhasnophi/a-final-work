package com.roomx.model.dto;

import java.util.Date;
import java.util.List;

import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;

import lombok.Data;

@Data
public class WorkOrderUpdateRequest {
    // 基本信息
    private String title;
    private String description;
    private WorkOrderPriority priority;
    private WorkOrderStatus status;
    
    // 处理人
    private Long assigneeId;
    
    // 房间信息
    private Long roomId;
    
    // 标签和附件
    private String tags;
    private List<String> attachments;
    
    // 时间信息
    private Date expectedCompletionTime;
    private Date actualCompletionTime;
    
    // 处理结果
    private String result;
    private String remarks;
    
    // 评分和反馈
    private Integer rating;
    private String feedback;
    
    // 自定义字段（JSON格式）
    private String customFields;
} 