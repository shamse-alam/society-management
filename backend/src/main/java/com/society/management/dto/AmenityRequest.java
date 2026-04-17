package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AmenityRequest {
    @NotBlank
    private String name;
    private String description;
    @NotNull
    private BigDecimal chargePerDay;
    private Boolean available;
    private Integer totalUnits;
}
