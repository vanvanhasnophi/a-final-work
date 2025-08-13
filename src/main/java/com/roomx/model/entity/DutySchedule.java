package com.roomx.model.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

/**
 * 值班表实体类
 */
@Entity
@Data
public class DutySchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 值班日期
     */
    @Temporal(TemporalType.DATE)
    private Date dutyDate;
    
    /**
     * 值班人员
     */
    @ManyToOne
    @JoinColumn(name = "duty_user_id")
    private User dutyUser;
    
    /**
     * 创建人
     */
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    /**
     * 创建时间
     */
    @Temporal(TemporalType.TIMESTAMP)
    private Date createTime;
    
    /**
     * 更新时间
     */
    @Temporal(TemporalType.TIMESTAMP)
    private Date updateTime;
    
    /**
     * 备注
     */
    private String remark;
    
    @PrePersist
    protected void onCreate() {
        Date now = new Date();
        this.createTime = now;
        this.updateTime = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updateTime = new Date();
    }
}
