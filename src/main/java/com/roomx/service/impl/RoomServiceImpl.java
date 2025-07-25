package com.roomx.service.impl;

import com.roomx.entity.Room;
import com.roomx.repository.RoomRepository;
import com.roomx.service.RoomService;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import com.roomx.model.dto.RoomInfoDTO;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.RoomQuery;

@Service
public class RoomServiceImpl implements RoomService {
    private final RoomRepository roomRepository;

    public RoomServiceImpl(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Override
    public RoomInfoDTO getRoomById(Long id) {
        Room room=roomRepository.findById(id).orElse(null);
        if(room==null) throw new IllegalArgumentException("room not found");
        return RoomInfoDTO.fromEntity(room);
    }

    @Override
    public RoomInfoDTO updateRoom(Long id, RoomInfoDTO roomInfoDTO) {
        Room room=roomRepository.findById(id).orElse(null);
        if(room==null) throw new IllegalArgumentException("room not found");
        room.update(roomInfoDTO);
        return RoomInfoDTO.fromEntity(roomRepository.save(room));
    }

    @Override
    public void deleteRoom(Long id) {
        roomRepository.deleteById(id);
    }

    @Override
    public PageResult<RoomInfoDTO> page(RoomQuery query, int pageNum, int pageSize) {
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
        PageResult<RoomInfoDTO> result = new PageResult<>();
        result.setRecords(page.getContent().stream().map(RoomInfoDTO::fromEntity).collect(Collectors.toList()));
        result.setTotal(page.getTotalElements());
        result.setPageNum(pageNum);
        result.setPageSize(pageSize);
        return result;
    }
} 