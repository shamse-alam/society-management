package com.society.management.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class DefaulterResponse {
    private Long userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String unitNumber;
    private String phone;
    private String email;
    private BigDecimal totalDue;
    private String oldestDueDate;
    private long daysOverdue;
    private int pendingCount;
    private List<PaymentResponse> pendingPayments;
}
