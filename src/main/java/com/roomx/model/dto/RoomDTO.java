package com.roomx.model.dto;

import java.util.Date;

import com.roomx.model.entity.Room;
import com.roomx.constant.enums.RoomStatus;
import com.roomx.constant.enums.RoomType;
import lombok.Data;

@Data
public class RoomDTO {
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


    public static RoomDTO fromEntity(Room room) {
        RoomDTO roomDTO = new RoomDTO();
        roomDTO.setId(room.getId());
        roomDTO.setName(room.getName());
        roomDTO.setDescription(room.getDescription());
        roomDTO.setType(room.getType());
        roomDTO.setCapacity(room.getCapacity());
        roomDTO.setLocation(room.getLocation());
        roomDTO.setStatus(room.getStatus());
        roomDTO.setCreateTime(room.getCreateTime());
        roomDTO.setUpdateTime(room.getUpdateTime());
        roomDTO.setLastMaintenanceTime(room.getLastMaintenanceTime());
        return roomDTO;
    }
}
