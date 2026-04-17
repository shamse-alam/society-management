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
    private String expenseDate;
    private String createdAt;

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
        }
        r.setExpenseDate(e.getExpenseDate() != null ? e.getExpenseDate().toString() : null);
        r.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return r;
    }
}
