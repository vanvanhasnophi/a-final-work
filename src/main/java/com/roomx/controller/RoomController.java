package com.roomx.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import com.roomx.model.entity.Room;
import com.roomx.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;

@RestController
@RequestMapping("/api/room")
public class RoomController {
    // 房间相关接口
    @GetMapping("/list") // 获取房间列表
    public ResponseEntity<List<Room>> list() {
        return ResponseEntity.ok(roomService.list());
    }

    @GetMapping("/{id}") // 获取房间详情
    public ResponseEntity<Room> get(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.get(id));
    }

    @PostMapping("/create") // 创建房间
    public ResponseEntity<Room> create(@RequestBody Room room) {
        return ResponseEntity.ok(roomService.create(room));
    }

    @PutMapping("/{id}") // 更新房间
    public ResponseEntity<Room> update(@PathVariable Long id, @RequestBody Room room) {
        return ResponseEntity.ok(roomService.update(id, room));
    }

    @DeleteMapping("/{id}") // 删除房间
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roomService.delete(id);
        return ResponseEntity.noContent().build();
    }
    

}
