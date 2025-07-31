package com.roomx.model.dto;

import com.roomx.constant.enums.RoomStatus;
import com.roomx.constant.enums.RoomType;

import lombok.Data;

@Data
public class RoomQuery {
    private RoomStatus status;
    private RoomType type;
    private String location;
    private String name;
}
