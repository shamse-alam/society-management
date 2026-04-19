package com.society.management.dto;

import com.society.management.entity.IncomeType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class IncomeTypeResponse {
    private Long id;
    private String code;
    private String displayName;
    private boolean gstApplicable;
    private boolean reserveFund;
    private boolean oneTime;
    private boolean systemManaged;
    private int displayOrder;
    private boolean active;
    private LocalDateTime createdAt;

    public static IncomeTypeResponse from(IncomeType e) {
        IncomeTypeResponse r = new IncomeTypeResponse();
        r.setId(e.getId());
        r.setCode(e.getCode());
        r.setDisplayName(e.getDisplayName());
        r.setGstApplicable(e.isGstApplicable());
        r.setReserveFund(e.isReserveFund());
        r.setOneTime(e.isOneTime());
        r.setSystemManaged(e.isSystemManaged());
        r.setDisplayOrder(e.getDisplayOrder());
        r.setActive(e.isActive());
        r.setCreatedAt(e.getCreatedAt());
        return r;
    }
}
