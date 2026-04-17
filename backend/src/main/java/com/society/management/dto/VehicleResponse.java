package com.society.management.dto;

import com.society.management.entity.Vehicle;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VehicleResponse {
    private Long id;
    private String vehicleNumber;
    private String vehicleType;
    private String make;
    private String model;
    private String color;
    private String stickerNumber;
    private String unitNumber;
    private String ownerName;
    private boolean active;
    private LocalDateTime createdAt;

    public static VehicleResponse from(Vehicle v) {
        VehicleResponse r = new VehicleResponse();
        r.setId(v.getId());
        r.setVehicleNumber(v.getVehicleNumber());
        r.setVehicleType(v.getVehicleType() != null ? v.getVehicleType().name() : null);
        r.setMake(v.getMake());
        r.setModel(v.getModel());
        r.setColor(v.getColor());
        r.setStickerNumber(v.getStickerNumber());
        r.setUnitNumber(v.getProperty() != null ? v.getProperty().getUnitNumber() : null);
        r.setOwnerName(v.getRegisteredBy() != null ? v.getRegisteredBy().getFullName() : null);
        r.setActive(v.isActive());
        r.setCreatedAt(v.getCreatedAt());
        return r;
    }
}
