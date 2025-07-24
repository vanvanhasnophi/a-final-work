package com.roomx.repository;

import com.roomx.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
    // 房间数据访问
}
