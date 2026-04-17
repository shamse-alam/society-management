package com.society.management.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InvoiceGenerationRequest {
    private String paymentType = "MAINTENANCE";
    private String periodMode = "MONTHLY"; // MONTHLY or CUSTOM
    private Integer month;
    private Integer year;
    private LocalDate periodFrom;
    private LocalDate periodTo;
    private BigDecimal amountPerUnit;
    private BigDecimal ratePerSqFt;
    private String calculationMode = "LUMPSUM"; // LUMPSUM or PER_SQFT
    private int dueDays = 15;
    private LocalDate dueDate; // used for ONE_TIME invoices
}
