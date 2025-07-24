package com.roomx.repository;

import com.roomx.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
    // 房间数据访问
    List<Room> findByStatus(Room.Status status);
    List<Room> findByType(Room.Type type);
    List<Room> findByLocation(String location);
    List<Room> findByCapacity(int capacity);
    List<Room> findByEquipment(String equipment);
    List<Room> findByPrice(double price);
    List<Room> findByStatusAndTypeAndLocationAndCapacityAndEquipmentAndPrice(Room.Status status, Room.Type type, String location, int capacity, String equipment, double price);
}
