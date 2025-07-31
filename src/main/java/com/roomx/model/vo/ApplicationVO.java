package com.roomx.model.vo;

import java.util.Date;

import com.roomx.constant.enums.ApplicationStatus;
import com.roomx.model.entity.Application;

import lombok.Data;

@Data
public class ApplicationVO {
    private Long id;
    private Long userId;
    private Long roomId;
    
    // 用户冗余信息
    private String username;
    private String userNickname;
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

    public static ApplicationVO fromEntity(Application app) {
        ApplicationVO vo = new ApplicationVO();
        vo.setId(app.getId());
        vo.setUserId(app.getUserId());
        vo.setRoomId(app.getRoomId());
        
        // 用户信息
        vo.setUsername(app.getUsername());
        vo.setUserNickname(app.getUserNickname());
        vo.setUserRole(app.getUserRole());
        
        // 房间信息
        vo.setRoomName(app.getRoomName());
        vo.setRoomLocation(app.getRoomLocation());
        vo.setRoomType(app.getRoomType());
        vo.setRoomCapacity(app.getRoomCapacity());
        
        // 申请信息
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
