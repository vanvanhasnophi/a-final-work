package com.roomx.model.dto;

import com.roomx.model.entity.Application;
import com.roomx.constant.enums.ApplicationStatus;
import java.util.Date;
import lombok.Data;

@Data
public class ApplicationDTO {
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


    public static ApplicationDTO fromEntity(Application application) {
        ApplicationDTO applicationDTO = new ApplicationDTO();
        applicationDTO.setId(application.getId());
        applicationDTO.setUserId(application.getUser().getId());
        applicationDTO.setRoomId(application.getRoom().getId());
        applicationDTO.setCrowd(application.getCrowd());
        applicationDTO.setContact(application.getContact());
        applicationDTO.setReason(application.getReason());
        applicationDTO.setStatus(application.getStatus());
        applicationDTO.setCreateTime(application.getCreateTime());
        applicationDTO.setUpdateTime(application.getUpdateTime());
        applicationDTO.setStartTime(application.getStartTime());
        applicationDTO.setEndTime(application.getEndTime());
        return applicationDTO;
    }

}
