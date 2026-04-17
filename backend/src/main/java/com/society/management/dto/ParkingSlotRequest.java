package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ParkingSlotRequest {
    @NotBlank
    private String slotNumber;
    @NotBlank
    private String slotType;
    private String zone;
    private String assignedUnitNumber;
    private Long assignedVehicleId;
}
