package com.roomx.model.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity
public class FootPrint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // 持久化id
    private Long id;
    
    // 操作人
    private Long operatorId;

    // 操作对象
    private Long userId;
    private Long applicationId;
    private Long roomId;

    // 操作类型
    private String action;

    // 时间
    @Temporal(TemporalType.TIMESTAMP)
    private Date timestamp;

    // 附加信息
    private String attach;
    
    // 临时信息字段（根据action类型存储不同的信息：name等）
    private String tempInfo;
    
    @PrePersist
    protected void onCreate() {
        timestamp = new Date();
    }
}
