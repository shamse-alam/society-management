package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VehicleRequest {
    @NotBlank
    private String vehicleNumber;
    private String vehicleType;
    private String make;
    private String model;
    private String color;
    private String unitNumber;
    private String stickerNumber;
}
