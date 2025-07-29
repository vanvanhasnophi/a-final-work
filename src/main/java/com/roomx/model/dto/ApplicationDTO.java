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
    
    // 用户冗余信息
    private String username;
    private String userNickname;
    private String userContact;
    private String userRole;
    
    // 房间冗余信息
    private String roomName;
    private String roomLocation;
    private String roomType;
    private Long roomCapacity;
    
    // 申请信息
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
        applicationDTO.setUserId(application.getUserId());
        applicationDTO.setRoomId(application.getRoomId());
        
        // 用户信息
        applicationDTO.setUsername(application.getUsername());
        applicationDTO.setUserNickname(application.getUserNickname());
        applicationDTO.setUserContact(application.getUserContact());
        applicationDTO.setUserRole(application.getUserRole());
        
        // 房间信息
        applicationDTO.setRoomName(application.getRoomName());
        applicationDTO.setRoomLocation(application.getRoomLocation());
        applicationDTO.setRoomType(application.getRoomType());
        applicationDTO.setRoomCapacity(application.getRoomCapacity());
        
        // 申请信息
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
