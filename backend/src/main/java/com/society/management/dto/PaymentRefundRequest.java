package com.society.management.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRefundRequest {

    @NotNull
    private Long paymentId;

    @NotNull
    @Positive
    private BigDecimal amount;

    private String reason;

    private String notes;

    private String rejectionReason;
}
