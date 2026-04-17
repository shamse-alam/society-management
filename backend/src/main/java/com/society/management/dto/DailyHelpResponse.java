package com.society.management.dto;

import com.society.management.entity.DailyHelp;
import lombok.Data;

@Data
public class DailyHelpResponse {
    private Long id;
    private String name;
    private String phone;
    private String category;
    private String unitNumber;
    private String residentName;
    private String workingDays;
    private String timeSlot;
    private boolean active;
    private String startDate;
    private String createdAt;

    public static DailyHelpResponse from(DailyHelp dh) {
        DailyHelpResponse r = new DailyHelpResponse();
        r.setId(dh.getId());
        r.setName(dh.getName());
        r.setPhone(dh.getPhone());
        r.setCategory(dh.getCategory().name());
        r.setUnitNumber(dh.getProperty() != null ? dh.getProperty().getUnitNumber() : dh.getUser().getUnitNumber());
        r.setResidentName(dh.getUser().getFullName());
        r.setWorkingDays(dh.getWorkingDays());
        r.setTimeSlot(dh.getTimeSlot());
        r.setActive(dh.isActive());
        r.setStartDate(dh.getStartDate() != null ? dh.getStartDate().toString() : null);
        r.setCreatedAt(dh.getCreatedAt() != null ? dh.getCreatedAt().toString() : null);
        return r;
    }
}
