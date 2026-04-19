package com.society.management.dto;

import com.society.management.entity.Payment;
import com.society.management.entity.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaymentResponse {
    private Long id;
    private Long userId;
    private String username;
    private String firstName;
    private String lastName;
    private String fullName;
    private String unitNumber;
    private String profileImage;
    private String paymentType;
    private BigDecimal amount;
    private String status;
    private String periodFrom;
    private String periodTo;
    private String description;
    private String receiptNumber;
    private String dueDate;
    private BigDecimal penaltyAmount;
    private boolean penaltyApplied;
    private boolean overdue;
    private String paidAt;
    private String createdAt;

    public static PaymentResponse from(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId());
        r.setUserId(p.getUser().getId());
        r.setUsername(p.getUser().getUsername());
        r.setFirstName(p.getUser().getFirstName());
        r.setLastName(p.getUser().getLastName());
        r.setFullName(p.getUser().getFullName());
        r.setUnitNumber(p.getUser().getUnitNumber());
        r.setProfileImage(p.getUser().getProfileImage());
        r.setPaymentType(p.getPaymentType());
        r.setAmount(p.getAmount());
        r.setStatus(p.getStatus().name());
        r.setPeriodFrom(p.getPeriodFrom() != null ? p.getPeriodFrom().toString() : null);
        r.setPeriodTo(p.getPeriodTo() != null ? p.getPeriodTo().toString() : null);
        r.setDescription(p.getDescription());
        r.setReceiptNumber(p.getReceiptNumber());
        r.setDueDate(p.getDueDate() != null ? p.getDueDate().toString() : null);
        r.setPenaltyAmount(p.getPenaltyAmount());
        r.setPenaltyApplied(p.isPenaltyApplied());
        r.setOverdue(p.getDueDate() != null && p.getDueDate().isBefore(LocalDate.now()) && p.getStatus() == PaymentStatus.PENDING);
        r.setPaidAt(p.getPaidAt() != null ? p.getPaidAt().toString() : null);
        r.setCreatedAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
        return r;
    }
}
