package com.roomx.service;

import com.roomx.model.Room;
import com.roomx.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoomService {
    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    // 业务逻辑：获取所有房间
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    // 业务逻辑：申请房间
    @Transactional
    public boolean applyRoom(Long userId, Long roomId) {
        // 1. 检查房间状态
        // 2. 检查用户资格
        // 3. 写入申请记录
        // 4. 更新房间状态
        // 这些操作都在service层完成
        return true;
    }
}
