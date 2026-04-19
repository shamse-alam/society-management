package com.society.management.dto;

import com.society.management.entity.PaymentRefund;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRefundResponse {
    private Long id;
    private Long paymentId;
    private String refundNumber;
    private BigDecimal amount;
    private String reason;
    private String status;
    private String requestedBy;
    private String approvedBy;
    private String approvedAt;
    private String rejectionReason;
    private String processedAt;
    private String notes;
    private String createdAt;

    // Original payment details
    private String paymentType;
    private String receiptNumber;
    private BigDecimal originalAmount;
    private String payerName;
    private String payerUnit;
    private Long userId;
    private String paidAt;
    private String paymentDescription;

    public static PaymentRefundResponse from(PaymentRefund r) {
        PaymentRefundResponse res = new PaymentRefundResponse();
        res.setId(r.getId());
        res.setPaymentId(r.getPayment().getId());
        res.setRefundNumber(r.getRefundNumber());
        res.setAmount(r.getAmount());
        res.setReason(r.getReason());
        res.setStatus(r.getStatus().name());
        res.setRequestedBy(r.getRequestedBy());
        res.setApprovedBy(r.getApprovedBy());
        res.setApprovedAt(r.getApprovedAt() != null ? r.getApprovedAt().toString() : null);
        res.setRejectionReason(r.getRejectionReason());
        res.setProcessedAt(r.getProcessedAt() != null ? r.getProcessedAt().toString() : null);
        res.setNotes(r.getNotes());
        res.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);

        // Original payment info
        res.setPaymentType(r.getPayment().getPaymentType());
        res.setReceiptNumber(r.getPayment().getReceiptNumber());
        res.setOriginalAmount(r.getPayment().getAmount());
        res.setPayerName(r.getUser().getFullName());
        res.setPayerUnit(r.getUser().getUnitNumber());
        res.setUserId(r.getUser().getId());
        res.setPaidAt(r.getPayment().getPaidAt() != null ? r.getPayment().getPaidAt().toString() : null);
        res.setPaymentDescription(r.getPayment().getDescription());

        return res;
    }
}
