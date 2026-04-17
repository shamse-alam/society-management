package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {
    private Long userId;

    @NotBlank
    private String paymentType;

    @NotNull
    private BigDecimal amount;

    private String periodFrom;
    private String periodTo;
    private String description;
}
