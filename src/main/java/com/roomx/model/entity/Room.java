package com.roomx.model.entity;

import java.util.Date;

import com.roomx.constant.enums.RoomStatus;
import com.roomx.constant.enums.RoomType;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private RoomType type;
    private Long capacity;
    private String location;
    private RoomStatus status;
    private Date createTime;
    private Date updateTime;
    private Date lastMaintenanceTime;


    public void setStatus(RoomStatus status) {
        if((this.status.onMaintenance())
        && (!status.onMaintenance())) {// 如果状态从维修中或待维修切换到其他，记录最后维修时间
            this.lastMaintenanceTime = new Date();
        }
        this.status = status;
    }
}
