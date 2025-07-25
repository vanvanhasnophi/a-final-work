package com.roomx.model.vo;

import com.roomx.entity.Room;
import com.roomx.enums.RoomType;
import java.util.Date;
import lombok.Data;

@Data
public class RoomVO {
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

    public static RoomVO fromEntity(Room room) {
        RoomVO vo = new RoomVO();
        vo.setId(room.getId());
        vo.setName(room.getName());
        vo.setDescription(room.getDescription());
        vo.setType(room.getType());
        vo.setCapacity(room.getCapacity());
        vo.setLocation(room.getLocation());
        vo.setStatus(room.getStatus());
        vo.setCreateTime(room.getCreateTime());
        vo.setUpdateTime(room.getUpdateTime());
        vo.setLastMaintenanceTime(room.getLastMaintenanceTime());
        return vo;
    }
} 