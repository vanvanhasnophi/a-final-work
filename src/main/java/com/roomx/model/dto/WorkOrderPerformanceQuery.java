package com.roomx.model.dto;

import java.util.Date;
import java.util.List;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;

import lombok.Data;

@Data
public class WorkOrderPerformanceQuery {
    // 基础查询条件
    private String orderNo;
    private String title;
    private String searchKeywords;
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
    
    // 性能优化字段
    private Boolean isOverdue;
    private Long minProcessingTime;
    private Long maxProcessingTime;
    private Integer minCommentCount;
    private Integer minAttachmentCount;
    private Integer minViewCount;
    
    // 时间范围
    private Date createTimeStart;
    private Date createTimeEnd;
    private Date updateTimeStart;
    private Date updateTimeEnd;
    private Date lastActivityTimeStart;
    private Date lastActivityTimeEnd;
    private Date expectedCompletionTimeStart;
    private Date expectedCompletionTimeEnd;
    private Date actualCompletionTimeStart;
    private Date actualCompletionTimeEnd;
    
    // 评分相关
    private Integer minRating;
    private Integer maxRating;
    
    // 标签和自定义字段
    private String tags;
    private String customFields;
    
    // 分页和排序
    private Integer page = 1;
    private Integer size = 10;
    private String sortBy = "createTime";
    private String sortOrder = "DESC";
    
    // 查询选项
    private Boolean includeDetails = false;
    private Boolean includeComments = false;
    private Boolean includeAttachments = false;
    private Boolean includeStats = false;
    
    // 缓存选项
    private Boolean useCache = true;
    private Integer cacheExpireSeconds = 300;
    
    // 性能优化选项
    private Boolean useIndexOnly = false;
    private String indexHint = "";
    private Integer maxResults = 1000;
    
    // 统计查询
    private Boolean isStatisticsQuery = false;
    private String groupBy;
    private List<String> aggregationFields;
} 