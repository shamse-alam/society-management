package com.society.management.dto;

import com.society.management.entity.VisitLog;
import lombok.Data;

@Data
public class VisitLogResponse {
    private Long id;
    private String visitorName;
    private String visitorPhone;
    private String visitorType;
    private String vehicleNumber;
    private Long residentId;
    private String residentName;
    private String unitNumber;
    private String purpose;
    private String passcode;
    private String status;
    private String expectedAt;
    private String validUntil;
    private String checkInTime;
    private String checkOutTime;
    private String guardNotes;
    private String createdAt;

    public static VisitLogResponse from(VisitLog vl) {
        VisitLogResponse r = new VisitLogResponse();
        r.setId(vl.getId());
        r.setVisitorName(vl.getVisitor().getName());
        r.setVisitorPhone(vl.getVisitor().getPhone());
        r.setVisitorType(vl.getVisitor().getVisitorType().name());
        r.setVehicleNumber(vl.getVisitor().getVehicleNumber());
        r.setResidentId(vl.getUser().getId());
        r.setResidentName(vl.getUser().getFullName());
        r.setUnitNumber(vl.getProperty() != null ? vl.getProperty().getUnitNumber() : vl.getUser().getUnitNumber());
        r.setPurpose(vl.getPurpose());
        r.setPasscode(vl.getPasscode());
        r.setStatus(vl.getStatus().name());
        r.setExpectedAt(vl.getExpectedAt() != null ? vl.getExpectedAt().toString() : null);
        r.setValidUntil(vl.getValidUntil() != null ? vl.getValidUntil().toString() : null);
        r.setCheckInTime(vl.getCheckInTime() != null ? vl.getCheckInTime().toString() : null);
        r.setCheckOutTime(vl.getCheckOutTime() != null ? vl.getCheckOutTime().toString() : null);
        r.setGuardNotes(vl.getGuardNotes());
        r.setCreatedAt(vl.getCreatedAt() != null ? vl.getCreatedAt().toString() : null);
        return r;
    }
}
