package com.roomx.repository;

import com.roomx.model.entity.Room;
import com.roomx.constant.enums.RoomStatus;
import com.roomx.constant.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long>, JpaSpecificationExecutor<Room> {
    // 房间数据访问
}
