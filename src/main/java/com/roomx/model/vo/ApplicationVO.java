package com.roomx.model.vo;

import com.roomx.model.entity.Application;
import com.roomx.constant.enums.ApplicationStatus;
import lombok.Data;
import java.util.Date;
@Data
public class ApplicationVO {
    private Long id;
    private Long userId;
    private Long roomId;
    private Long crowd; 
    private String contact;
    private String reason;
    private ApplicationStatus status;
    private Date createTime;
    private Date updateTime;
    private Date startTime;
    private Date endTime;

    public static ApplicationVO fromEntity(Application app) {
        ApplicationVO vo = new ApplicationVO();
        vo.setId(app.getId());
        vo.setUserId(app.getUserId());
        vo.setRoomId(app.getRoomId());
        vo.setCrowd(app.getCrowd());
        vo.setContact(app.getContact());
        vo.setReason(app.getReason());
        vo.setStatus(app.getStatus());
        vo.setCreateTime(app.getCreateTime());
        vo.setUpdateTime(app.getUpdateTime());
        vo.setStartTime(app.getStartTime());
        vo.setEndTime(app.getEndTime());
        return vo;
    }
}
