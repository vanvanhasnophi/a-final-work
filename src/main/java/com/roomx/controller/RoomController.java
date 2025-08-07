package com.roomx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.annotation.RequireAuth;
import com.roomx.constant.enums.UserRole;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.RoomDTO;
import com.roomx.model.dto.RoomQuery;
import com.roomx.service.RoomService;

@RestController
@RequestMapping("/api/room")
public class RoomController {
    // 教室相关接口 
    @Autowired
    private RoomService roomService;

    @GetMapping("/page") // 获取教室列表
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER})
    public ResponseEntity<PageResult<RoomDTO>> page(RoomQuery query,
                                                          @RequestParam(defaultValue = "1") int pageNum,
                                                          @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<RoomDTO> pageResult = roomService.page(query, pageNum, pageSize);
        return ResponseEntity.ok(pageResult);
    }

    @GetMapping("/{id}") // 获取教室详情
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER})
    public ResponseEntity<RoomDTO> get(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    @PostMapping("/create") // 创建教室
    @RequireAuth(roles = {UserRole.ADMIN})
    public ResponseEntity<RoomDTO> create(@RequestBody RoomDTO room) {
        return ResponseEntity.ok(roomService.addRoom(room));
    }

    @PutMapping("/{id}") // 更新教室
    @RequireAuth(roles = {UserRole.ADMIN})
    public ResponseEntity<RoomDTO> update(@PathVariable Long id, @RequestBody RoomDTO room) {
        return ResponseEntity.ok(roomService.updateRoom(id, room));
    }

    @DeleteMapping("/{id}") // 删除教室
    @RequireAuth(roles = {UserRole.ADMIN})
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
    

}
