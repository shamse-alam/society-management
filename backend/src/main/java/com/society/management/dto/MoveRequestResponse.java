package com.society.management.dto;

import com.society.management.entity.MoveRequest;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class MoveRequestResponse {
    private Long id;
    private String userName;
    private String unitNumber;
    private String moveType;
    private LocalDate scheduledDate;
    private String timeSlot;
    private String status;
    private String vehicleDetails;
    private String moversCompany;
    private String moversPhone;
    private String adminRemarks;
    private boolean nocIssued;
    private LocalDate nocIssuedDate;
    private String notes;
    private String approvedByName;
    private LocalDateTime createdAt;

    public static MoveRequestResponse from(MoveRequest m) {
        MoveRequestResponse r = new MoveRequestResponse();
        r.setId(m.getId());
        r.setUserName(m.getUser() != null ? m.getUser().getFullName() : null);
        r.setUnitNumber(m.getProperty() != null ? m.getProperty().getUnitNumber() : null);
        r.setMoveType(m.getMoveType() != null ? m.getMoveType().name() : null);
        r.setScheduledDate(m.getScheduledDate());
        r.setTimeSlot(m.getTimeSlot());
        r.setStatus(m.getStatus() != null ? m.getStatus().name() : null);
        r.setVehicleDetails(m.getVehicleDetails());
        r.setMoversCompany(m.getMoversCompany());
        r.setMoversPhone(m.getMoversPhone());
        r.setAdminRemarks(m.getAdminRemarks());
        r.setNocIssued(m.isNocIssued());
        r.setNocIssuedDate(m.getNocIssuedDate());
        r.setNotes(m.getNotes());
        r.setApprovedByName(m.getApprovedBy() != null ? m.getApprovedBy().getFullName() : null);
        r.setCreatedAt(m.getCreatedAt());
        return r;
    }
}
