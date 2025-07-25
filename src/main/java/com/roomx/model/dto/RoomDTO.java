package com.roomx.model.dto;

import com.roomx.model.entity.Room;
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
    private String status;
    private String createTime;
    private String updateTime;
    private String lastMaintenanceTime;

    public Room toEntity() {
        Room room = new Room();
        room.setId(this.id);
        room.setName(this.name);
        room.setDescription(this.description);
        room.setType(this.type);
        room.setCapacity(this.capacity);
        room.setLocation(this.location);
        // 其他字段可根据需要补充
        return room;
    }
}
