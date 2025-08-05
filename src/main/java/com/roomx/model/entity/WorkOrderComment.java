package com.roomx.model.entity;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "work_order_comment")
public class WorkOrderComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 关联的工单
    @Column(name = "work_order_id", nullable = false)
    private Long workOrderId;
    
    // 评论人信息
    @Column(name = "commenter_id", nullable = false)
    private Long commenterId;
    
    @Column(name = "commenter_name", length = 100)
    private String commenterName;
    
    @Column(name = "commenter_role", length = 50)
    private String commenterRole;
    
    // 评论内容
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;
    
    // 评论类型：普通评论、状态变更、系统通知等
    @Column(name = "comment_type", length = 50)
    private String commentType;
    
    // 附件信息
    @Column(name = "attachments", length = 1000)
    private String attachments;
    
    // 时间信息
    @Column(name = "create_time", nullable = false)
    private Date createTime;
    
    @Column(name = "update_time")
    private Date updateTime;
    
    // 是否内部评论（仅管理员可见）
    @Column(name = "is_internal")
    private Boolean isInternal = false;
    
    // 父评论ID（用于回复功能）
    @Column(name = "parent_id")
    private Long parentId;
    
    // 点赞数
    @Column(name = "like_count")
    private Integer likeCount = 0;

    // JPA关联
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", referencedColumnName = "id", insertable = false, updatable = false)
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commenter_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User commenter;

    // 构造函数
    public WorkOrderComment() {
        this.createTime = new Date();
        this.updateTime = this.createTime;
    }
    
    // 同步评论人信息
    public void syncCommenterInfo(User user) {
        if (user != null) {
            this.commenterId = user.getId();
            this.commenterName = user.getUsername();
            this.commenterRole = user.getRole() != null ? user.getRole().name() : null;
        }
    }
} 