package com.roomx.service;

import com.roomx.model.dto.RoomDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.RoomQuery;
import com.roomx.constant.enums.RoomStatus;

public interface RoomService {
    // 获取房间信息
    RoomDTO getRoomById(Long id);
    // 更新房间信息
    RoomDTO updateRoom(Long id, RoomDTO roomDTO);
    // 删除房间
    void deleteRoom(Long id);
    // 添加房间
    RoomDTO addRoom(RoomDTO roomDTO);
    // 更新房间状态
    void updateRoomStatus(Long id, RoomStatus status);
    // 获取房间列表
    PageResult<RoomDTO> page(RoomQuery query, int pageNum, int pageSize);
}
