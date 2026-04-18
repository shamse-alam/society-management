package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ExpenseRequest {
    @NotBlank
    private String category;
    @NotNull
    private BigDecimal amount;
    private String description;
    private String paidTo;
    private Long vendorId;
    @NotBlank
    private String expenseDate;

    private String paymentMode;
    private String chequeNumber;
    private String chequeDate;
    private String chequeBankName;
    private String transactionReference;
    private String transactionDate;
    private String notes;
}
