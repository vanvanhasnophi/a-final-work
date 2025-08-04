package com.roomx.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomx.constant.enums.RoomStatus;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.RoomDTO;
import com.roomx.model.dto.RoomQuery;
import com.roomx.model.entity.Application;
import com.roomx.model.entity.Room;
import com.roomx.repository.ApplicationRepository;
import com.roomx.repository.RoomRepository;
import com.roomx.service.RoomService;

import jakarta.persistence.criteria.Predicate;

@Service
public class RoomServiceImpl implements RoomService {
    private final RoomRepository roomRepository;
    private final ApplicationRepository applicationRepository;

    public RoomServiceImpl(RoomRepository roomRepository, ApplicationRepository applicationRepository) {
        this.roomRepository = roomRepository;
        this.applicationRepository = applicationRepository;
    }

    @Override
    public RoomDTO getRoomById(Long id) {
        Room room=roomRepository.findById(id).orElse(null);
        if(room==null) throw new IllegalArgumentException("room not found");
        return RoomDTO.fromEntity(room);
    }

    @Override
    public RoomDTO updateRoom(Long id, RoomDTO roomInfoDTO) {
        Room room=roomRepository.findById(id).orElse(null);
        if(room==null) throw new IllegalArgumentException("room not found");
        room.setStatus(roomInfoDTO.getStatus());
        room.setType(roomInfoDTO.getType());
        room.setLocation(roomInfoDTO.getLocation());
        room.setCapacity(roomInfoDTO.getCapacity());
        room.setDescription(roomInfoDTO.getDescription());
        room.setCreateTime(roomInfoDTO.getCreateTime());
        room.setUpdateTime(roomInfoDTO.getUpdateTime());
        return RoomDTO.fromEntity(roomRepository.save(room));
    }

    @Override
    @Transactional
    public void deleteRoom(Long id) {
        // 检查房间是否存在
        Room room = roomRepository.findById(id).orElse(null);
        if (room == null) {
            throw new IllegalArgumentException("房间不存在");
        }
        
        // 检查是否有相关的申请数据
        List<Application> relatedApplications = applicationRepository.findByRoomId(id);
        if (!relatedApplications.isEmpty()) {
            throw new IllegalArgumentException("该房间存在相关申请记录，无法删除。请先处理相关申请。");
        }
        
        // 检查房间状态，如果房间正在使用中，不允许删除
        if (room.getStatus() == RoomStatus.USING || room.getStatus() == RoomStatus.RESERVED) {
            throw new IllegalArgumentException("房间正在使用中或已预约，无法删除。请等待房间空闲后再删除。");
        }
        
        // 删除房间
        roomRepository.deleteById(id);
    }

    @Override
    public PageResult<RoomDTO> page(RoomQuery query, int pageNum, int pageSize) {
        Specification<Room> spec = (root, cq, cb) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();
            if (query.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), query.getStatus()));
            }
            if (query.getType() != null) {
                predicates.add(cb.equal(root.get("type"), query.getType()));
            }
            if (query.getLocation() != null && !query.getLocation().isEmpty()) {
                predicates.add(cb.like(root.get("location"), "%" + query.getLocation() + "%"));
            }
            if (query.getName() != null && !query.getName().isEmpty()) {
                predicates.add(cb.like(root.get("name"), "%" + query.getName() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize);
        Page<Room> page = roomRepository.findAll(spec, pageable);
        PageResult<RoomDTO> result = new PageResult<>();
        result.setRecords(page.getContent().stream().map(RoomDTO::fromEntity).collect(Collectors.toList()));
        result.setTotal(page.getTotalElements());
        result.setPageNum(pageNum);
        result.setPageSize(pageSize);
        return result;
    }

    @Override
    public RoomDTO addRoom(RoomDTO roomDTO) {
        Room room = new Room();
        room.setName(roomDTO.getName());
        room.setDescription(roomDTO.getDescription());
        room.setType(roomDTO.getType());
        room.setCapacity(roomDTO.getCapacity());
        room.setLocation(roomDTO.getLocation());
        room.setStatus(RoomStatus.AVAILABLE);
        room.setCreateTime(roomDTO.getCreateTime());
        room.setUpdateTime(roomDTO.getUpdateTime());
        room.setLastMaintenanceTime(roomDTO.getLastMaintenanceTime());
        return RoomDTO.fromEntity(roomRepository.save(room));
    }

    @Override
    public void updateRoomStatus(Long id, RoomStatus status) {
        Room room = roomRepository.findById(id).orElse(null);
        if(room==null) throw new IllegalArgumentException("room not found");
        room.setStatus(status);
        roomRepository.save(room);  
    }   

} 