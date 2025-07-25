package com.roomx.service;

import com.roomx.dto.RoomInfoDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.RoomQuery;

public interface RoomService {
    // 获取房间信息
    RoomInfoDTO getRoomById(Long id);
    // 更新房间信息
    RoomInfoDTO updateRoom(Long id, RoomInfoDTO roomInfoDTO);
    // 删除房间
    void deleteRoom(Long id);
    // 添加房间
    RoomInfoDTO addRoom(RoomInfoDTO roomInfoDTO);
    // 更新房间状态
    void updateRoomStatus(Long id, RoomStatus status);
    // 获取房间列表
    PageResult<RoomInfoDTO> page(RoomQuery query, int pageNum, int pageSize);
}
