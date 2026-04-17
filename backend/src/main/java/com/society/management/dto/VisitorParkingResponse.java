package com.society.management.dto;

import com.society.management.entity.VisitorParking;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VisitorParkingResponse {
    private Long id;
    private String slotNumber;
    private String vehicleNumber;
    private String visitorName;
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private String checkedInByName;
    private LocalDateTime createdAt;

    public static VisitorParkingResponse from(VisitorParking vp) {
        VisitorParkingResponse r = new VisitorParkingResponse();
        r.setId(vp.getId());
        r.setSlotNumber(vp.getSlot() != null ? vp.getSlot().getSlotNumber() : null);
        r.setVehicleNumber(vp.getVehicleNumber());
        r.setVisitorName(vp.getVisitorName());
        r.setCheckIn(vp.getCheckIn());
        r.setCheckOut(vp.getCheckOut());
        r.setCheckedInByName(vp.getCheckedInBy() != null ? vp.getCheckedInBy().getFullName() : null);
        r.setCreatedAt(vp.getCreatedAt());
        return r;
    }
}
