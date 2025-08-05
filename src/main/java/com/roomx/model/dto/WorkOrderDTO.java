package com.roomx.model.dto;

import java.util.Date;
import java.util.List;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;

import lombok.Data;

@Data
public class WorkOrderDTO {
    private Long id;
    private String orderNo;
    private String title;
    private String description;
    private OrderType orderType;
    private WorkOrderStatus status;
    private WorkOrderPriority priority;
    
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
    private Date updateTime;
    private Date expectedCompletionTime;
    private Date actualCompletionTime;
    private String remarks;
    private String result;
    private Integer rating;
    private String feedback;
    
    // 扩展信息
    private List<WorkOrderCommentDTO> comments;
    private List<WorkOrderAttachmentDTO> attachmentList;
    private WorkOrderStatsDTO stats;
} 