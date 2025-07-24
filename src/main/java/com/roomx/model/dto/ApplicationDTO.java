package com.roomx.model.dto;

import com.roomx.entity.Application;
import com.roomx.enums.ApplicationStatus;
import lombok.Data;

@Data
public class ApplicationDTO {
    private Long id;
    private Long userId;
    private Long roomId;
    private Long crowd;
    private String reason;
    private ApplicationStatus status;
    private String createTime;
    private String updateTime;

    public Application toEntity() {
        Application app = new Application();
        app.setId(this.id);
        app.setUserId(this.userId);
        app.setRoomId(this.roomId);
        app.setCrowd(this.crowd);
        app.setReason(this.reason);
        app.setStatus(this.status);
        // 其他字段可根据需要补充
        return app;
    }
}
