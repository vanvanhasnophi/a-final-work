package com.roomx.model.dto;

import java.util.Date;
import java.util.List;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;

import lombok.Data;

@Data
public class WorkOrderQuery {
    // 分页参数
    private Integer page = 1;
    private Integer size = 10;
    
    // 基础查询条件
    private String orderNo;
    private String title;
    private String description;
    private List<OrderType> orderTypes;
    private List<WorkOrderStatus> statuses;
    private List<WorkOrderPriority> priorities;
    
    // 人员相关
    private Long submitterId;
    private String submitterName;
    private Long assigneeId;
    private String assigneeName;
    
    // 房间相关
    private Long roomId;
    private String roomName;
    private String roomLocation;
    
    // 标签相关
    private String tags;
    
    // 时间范围
    private Date createTimeStart;
    private Date createTimeEnd;
    private Date updateTimeStart;
    private Date updateTimeEnd;
    private Date expectedCompletionTimeStart;
    private Date expectedCompletionTimeEnd;
    private Date actualCompletionTimeStart;
    private Date actualCompletionTimeEnd;
    
    // 评分相关
    private Integer minRating;
    private Integer maxRating;
    
    // 排序
    private String sortBy = "createTime";
    private String sortOrder = "DESC";
    
    // 是否包含已删除
    private Boolean includeDeleted = false;
    
    // 是否包含内部评论
    private Boolean includeInternalComments = false;
} 