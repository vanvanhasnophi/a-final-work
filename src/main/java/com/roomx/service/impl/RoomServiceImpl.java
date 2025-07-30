package com.roomx.service.impl;

import com.roomx.model.entity.Room;
import com.roomx.repository.RoomRepository;
import com.roomx.service.RoomService;
import org.springframework.stereotype.Service;
import java.util.stream.Collectors;
import com.roomx.model.dto.RoomDTO;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.RoomQuery;
import com.roomx.constant.enums.RoomStatus;

@Service
public class RoomServiceImpl implements RoomService {
    private final RoomRepository roomRepository;

    public RoomServiceImpl(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
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
    public void deleteRoom(Long id) {
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
        room.setStatus(roomDTO.getStatus());
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