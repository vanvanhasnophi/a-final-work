package com.roomx.model.dto;

import java.util.List;

import lombok.Data;

@Data
public class PageResult<T> {
    private List<T> records; // 当前页数据
    private long total;      // 总记录数
    private int pageNum;     // 当前页码
    private int pageSize;    // 每页条数
}
