package com.roomx.model.entity;

import java.util.Date;
import com.roomx.constant.enums.ApplicationStatus;
import lombok.Data;
import jakarta.persistence.*;
import com.roomx.model.entity.*;

@Data
@Entity
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long crowd;
    private String contact;
    private String reason;
    private ApplicationStatus status;
    private Date createTime;
    private Date updateTime;
    private Date startTime;
    private Date endTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    // constructor
    public Application() {
        this.createTime = new Date();
        this.updateTime = this.createTime;
        this.status = ApplicationStatus.PENDING;
    }

    public Application(Long userId, Long roomId, Long crowd, String reason, Date startTime, Date endTime) {
        this.userId = userId;
        this.roomId = roomId;
        this.crowd = crowd;
        this.reason = reason;
        this.startTime = startTime;
        this.endTime = endTime;
        this.createTime = new Date();
        this.updateTime = this.createTime;
        this.status = ApplicationStatus.PENDING;
    }
    

}
