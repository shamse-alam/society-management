package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PropertyRequest {
    @NotBlank
    private String unitNumber;
    private String ownerName;
    private Long ownerId;
    private String status;
    private String tenantName;
    private String tenantPhone;
    private Integer areaInSqFt;
    private String propertyType;
    private String description;
}
