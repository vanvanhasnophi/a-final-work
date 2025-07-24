package com.roomx.service.impl;

import com.roomx.entity.Room;
import com.roomx.repository.RoomRepository;
import com.roomx.service.RoomService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class RoomServiceImpl implements RoomService {
    private final RoomRepository roomRepository;

    public RoomServiceImpl(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Override
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    @Override
    @Transactional
    public boolean applyRoom(Long userId, Long roomId) {
        // 1. 检查房间状态
        // 2. 检查用户资格
        // 3. 写入申请记录
        // 4. 更新房间状态
        // 这些操作都在service层完成
        return true;
    }

    @Override
    public Room getRoomById(Long id) {
        return roomRepository.findById(id).orElse(null);
    }

    @Override
    public Room saveRoom(Room room) {
        return roomRepository.save(room);
    }

    @Override
    public void deleteRoom(Long id) {
        roomRepository.deleteById(id);
    }
} 