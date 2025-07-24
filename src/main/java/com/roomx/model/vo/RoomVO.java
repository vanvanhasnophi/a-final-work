package com.roomx.model.vo;

import com.roomx.entity.Room;
import com.roomx.enums.RoomType;
import lombok.Data;

@Data
public class RoomVO {
    private Long id;
    private String name;
    private String description;
    private RoomType type;
    private Long capacity;
    private String location;
    private String status;
    private String createTime;
    private String updateTime;
    private String lastMaintenanceTime;

    public static RoomVO fromEntity(Room room) {
        RoomVO vo = new RoomVO();
        vo.setId(room.getId());
        vo.setName(room.getName());
        vo.setDescription(room.getDescription());
        vo.setType(room.getType());
        vo.setCapacity(room.getCapacity());
        vo.setLocation(room.getLocation());
        // 其他字段可根据需要补充
        return vo;
    }
} 