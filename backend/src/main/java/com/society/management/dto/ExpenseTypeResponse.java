package com.society.management.dto;

import com.society.management.entity.ExpenseType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExpenseTypeResponse {
    private Long id;
    private String code;
    private String displayName;
    private boolean gstIncluded;
    private int displayOrder;
    private boolean active;
    private LocalDateTime createdAt;

    public static ExpenseTypeResponse from(ExpenseType e) {
        ExpenseTypeResponse r = new ExpenseTypeResponse();
        r.setId(e.getId());
        r.setCode(e.getCode());
        r.setDisplayName(e.getDisplayName());
        r.setGstIncluded(e.isGstIncluded());
        r.setDisplayOrder(e.getDisplayOrder());
        r.setActive(e.isActive());
        r.setCreatedAt(e.getCreatedAt());
        return r;
    }
}
