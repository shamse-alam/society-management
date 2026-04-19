package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class FundReleaseRequest {
    @NotBlank
    private String fundType;
    @NotNull
    private BigDecimal amount;
    @NotBlank
    private String reason;
    private String notes;
    private String rejectionReason;
}
