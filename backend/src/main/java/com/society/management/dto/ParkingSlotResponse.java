package com.society.management.dto;

import com.society.management.entity.ParkingSlot;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ParkingSlotResponse {
    private Long id;
    private String slotNumber;
    private String slotType;
    private String zone;
    private String assignedUnitNumber;
    private String assignedVehicleNumber;
    private boolean occupied;
    private boolean active;
    private LocalDateTime createdAt;

    public static ParkingSlotResponse from(ParkingSlot s) {
        ParkingSlotResponse r = new ParkingSlotResponse();
        r.setId(s.getId());
        r.setSlotNumber(s.getSlotNumber());
        r.setSlotType(s.getSlotType() != null ? s.getSlotType().name() : null);
        r.setZone(s.getZone());
        r.setAssignedUnitNumber(s.getAssignedProperty() != null ? s.getAssignedProperty().getUnitNumber() : null);
        r.setAssignedVehicleNumber(s.getAssignedVehicle() != null ? s.getAssignedVehicle().getVehicleNumber() : null);
        r.setOccupied(s.isOccupied());
        r.setActive(s.isActive());
        r.setCreatedAt(s.getCreatedAt());
        return r;
    }
}
