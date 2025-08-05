package com.roomx.constant.enums;

public enum WorkOrderPriority {
    LOW("低", 1),
    MEDIUM("中", 2),
    HIGH("高", 3),
    URGENT("紧急", 4);

    private final String description;
    private final int level;

    WorkOrderPriority(String description, int level) {
        this.description = description;
        this.level = level;
    }

    public String getDescription() {
        return description;
    }

    public int getLevel() {
        return level;
    }
} 