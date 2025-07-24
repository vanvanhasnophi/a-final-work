package com.roomx.service;

import com.roomx.entity.Room;
import java.util.List;

public interface RoomService {
    List<Room> getAllRooms();
    boolean applyRoom(Long userId, Long roomId);
    Room getRoomById(Long id);
    Room saveRoom(Room room);
    void deleteRoom(Long id);
    // 其他房间相关业务方法...
}
