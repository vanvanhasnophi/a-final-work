package com.roomx.model.vo;

import com.roomx.entity.Application;
import com.roomx.enums.ApplicationStatus;
import lombok.Data;

@Data
public class ApplicationVO {
    private Long id;
    private Long userId;
    private Long roomId;
    private Long crowd;
    private String reason;
    private ApplicationStatus status;
    private String createTime;
    private String updateTime;

    public static ApplicationVO fromEntity(Application app) {
        ApplicationVO vo = new ApplicationVO();
        vo.setId(app.getId());
        vo.setUserId(app.getUserId());
        vo.setRoomId(app.getRoomId());
        vo.setCrowd(app.getCrowd());
        vo.setReason(app.getReason());
        vo.setStatus(app.getStatus());
        // 其他字段可根据需要补充
        return vo;
    }
}
