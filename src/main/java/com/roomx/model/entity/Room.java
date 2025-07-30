package com.roomx.model.entity;

import java.util.Date;
import com.roomx.constant.enums.RoomStatus;
import com.roomx.constant.enums.RoomType;
import lombok.*;
import jakarta.persistence.*;

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

}
