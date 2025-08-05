package com.roomx.model.vo;

import java.util.Date;
import java.util.List;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;

import lombok.Data;

@Data
public class WorkOrderVO {
    private Long id;
    private String orderNo;
    private String title;
    private String description;
    private OrderType orderType;
    private String orderTypeDesc;
    private WorkOrderStatus status;
    private String statusDesc;
    private WorkOrderPriority priority;
    private String priorityDesc;
    
    // 提交人信息
    private Long submitterId;
    private String submitterName;
    private String submitterRole;
    
    // 处理人信息
    private Long assigneeId;
    private String assigneeName;
    private String assigneeRole;
    
    // 房间信息
    private Long roomId;
    private String roomName;
    private String roomLocation;
    
    // 其他信息
    private String tags;
    private String attachments;
    private Date createTime;
    private String createTimeStr;
    private Date updateTime;
    private String updateTimeStr;
    private Date expectedCompletionTime;
    private String expectedCompletionTimeStr;
    private Date actualCompletionTime;
    private String actualCompletionTimeStr;
    private String remarks;
    private String result;
    private Integer rating;
    private String feedback;
    
    // 扩展信息
    private List<WorkOrderCommentVO> comments;
    private List<WorkOrderAttachmentVO> attachmentList;
    private WorkOrderStatsVO stats;
    
    // 计算字段
    private Long processingTime; // 处理时间（分钟）
    private Boolean isOverdue; // 是否逾期
    private String statusColor; // 状态颜色
    private String priorityColor; // 优先级颜色
} 