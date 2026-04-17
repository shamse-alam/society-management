package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeliveryLogRequest {
    @NotBlank
    private String unitNumber;
    @NotBlank
    private String deliveryService;
    private String description;
}
