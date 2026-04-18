package com.society.management.dto;

import com.society.management.entity.Expense;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ExpenseResponse {
    private Long id;
    private String category;
    private BigDecimal amount;
    private String description;
    private String paidTo;
    private Long vendorId;
    private String vendorName;
    private String vendorEmail;
    private String expenseDate;
    private String createdAt;

    private String voucherNumber;
    private String status;
    private String paymentMode;
    private String chequeNumber;
    private String chequeDate;
    private String chequeBankName;
    private String transactionReference;
    private String transactionDate;
    private String approvedBy;
    private String approvedAt;
    private String billAttachment;
    private String notes;
    private String updatedAt;

    public static ExpenseResponse from(Expense e) {
        ExpenseResponse r = new ExpenseResponse();
        r.setId(e.getId());
        r.setCategory(e.getCategory());
        r.setAmount(e.getAmount());
        r.setDescription(e.getDescription());
        r.setPaidTo(e.getPaidTo());
        if (e.getVendor() != null) {
            r.setVendorId(e.getVendor().getId());
            r.setVendorName(e.getVendor().getName());
            r.setVendorEmail(e.getVendor().getEmail());
        }
        r.setExpenseDate(e.getExpenseDate() != null ? e.getExpenseDate().toString() : null);
        r.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        r.setVoucherNumber(e.getVoucherNumber());
        r.setStatus(e.getStatus() != null ? e.getStatus().name() : null);
        r.setPaymentMode(e.getPaymentMode() != null ? e.getPaymentMode().name() : null);
        r.setChequeNumber(e.getChequeNumber());
        r.setChequeDate(e.getChequeDate() != null ? e.getChequeDate().toString() : null);
        r.setChequeBankName(e.getChequeBankName());
        r.setTransactionReference(e.getTransactionReference());
        r.setTransactionDate(e.getTransactionDate() != null ? e.getTransactionDate().toString() : null);
        r.setApprovedBy(e.getApprovedBy());
        r.setApprovedAt(e.getApprovedAt() != null ? e.getApprovedAt().toString() : null);
        r.setBillAttachment(e.getBillAttachment());
        r.setNotes(e.getNotes());
        r.setUpdatedAt(e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null);
        return r;
    }
}
