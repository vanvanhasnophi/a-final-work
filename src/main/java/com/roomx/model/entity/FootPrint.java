package com.roomx.model.entity;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity
@Table(name = "footprint")
public class FootPrint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // 持久化id
    private Long id;
    
    // 操作人
    @Column(name = "operator_id")
    private Long operatorId;

    // 操作对象
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "application_id")
    private Long applicationId;
    
    @Column(name = "room_id")
    private Long roomId;

    // 操作类型
    private String action;

    // 时间
    @Temporal(TemporalType.TIMESTAMP)
    private Date timestamp;

    // 附加信息 - 映射到数据库的description字段
    @Column(name = "description")
    private String attach;
    
    // 临时信息字段（根据action类型存储不同的信息：name等）
    @Column(name = "temp_info")
    private String tempInfo;
    
    @PrePersist
    protected void onCreate() {
        timestamp = new Date();
    }
}
