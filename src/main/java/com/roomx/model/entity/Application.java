package com.roomx.model.entity;

import java.util.Date;
import com.roomx.constant.enums.ApplicationStatus;
import lombok.*;
import jakarta.persistence.*;

@Data
@Entity
@Table(name = "application")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 外键字段，用于数据完整性
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "room_id", nullable = false)
    private Long roomId;
    
    // 冗余字段，用于查询优化
    @Column(name = "username", length = 100)
    private String username;
    
    @Column(name = "user_nickname", length = 100)
    private String userNickname;
    
    @Column(name = "user_contact", length = 100)
    private String userContact;
    
    @Column(name = "user_role", length = 50)
    private String userRole;
    
    @Column(name = "room_name", length = 100)
    private String roomName;
    
    @Column(name = "room_location", length = 200)
    private String roomLocation;
    
    @Column(name = "room_type", length = 50)
    private String roomType;
    
    @Column(name = "room_capacity")
    private Long roomCapacity;
    
    // 申请相关字段
    private Long crowd;
    private String contact;
    private String reason;
    
    @Enumerated(EnumType.STRING)
    private ApplicationStatus status;
    
    private Date createTime;
    private Date updateTime;
    private Date startTime;
    private Date endTime;

    // JPA关联，用于数据完整性检查，但不用于查询
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Room room;

    // constructor
    public Application() {
        this.createTime = new Date();
        this.updateTime = this.createTime;
        this.status = ApplicationStatus.PENDING;
    }
    
    // 便捷方法，用于同步冗余字段
    public void syncUserInfo(User user) {
        if (user != null) {
            this.userId = user.getId();
            this.username = user.getUsername();
            this.userNickname = user.getNickname();
            this.userContact = user.getContact();
            this.userRole = user.getRole() != null ? user.getRole().name() : null;
        }
    }
    
    public void syncRoomInfo(Room room) {
        if (room != null) {
            this.roomId = room.getId();
            this.roomName = room.getName();
            this.roomLocation = room.getLocation();
            this.roomType = room.getType() != null ? room.getType().name() : null;
            this.roomCapacity = room.getCapacity();
        }
    }
}
