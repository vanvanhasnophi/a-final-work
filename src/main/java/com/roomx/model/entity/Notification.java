package com.roomx.model.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String content;
    private String type; // system, application, room, user
    private String priority; // low, normal, high, urgent
    private Boolean isRead;
    private Long userId; // 接收通知的用户ID
    private Date createTime;
    private Date readTime;
    
    // 可选的操作信息
    private String actionType; // navigate, refresh
    private String actionTarget; // 操作目标，如页面路径
    
    // 关联信息
    private Long relatedId; // 关联的申请ID、房间ID等
    private String relatedType; // 关联类型
} 