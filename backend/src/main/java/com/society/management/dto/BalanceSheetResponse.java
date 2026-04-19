package com.society.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class BalanceSheetResponse {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private List<IncomeEntry> incomeBreakdown;
    private List<ExpenseEntry> expenseBreakdown;
    private List<IncomeLineItem> incomeItems;
    private List<ExpenseResponse> expenseItems;

    // Reserve fund fields
    private BigDecimal operationalIncome;
    private BigDecimal totalReserveFunds;
    private BigDecimal releasedReserveFunds;
    private BigDecimal lockedReserveFunds;
    private BigDecimal availableBalance;
    private List<ReserveFundEntry> reserveBreakdown;

    @Data
    @AllArgsConstructor
    public static class IncomeEntry {
        private String type;
        private BigDecimal amount;
        private int count;
        private boolean gstApplicable;
    }

    @Data
    @AllArgsConstructor
    public static class ExpenseEntry {
        private String category;
        private BigDecimal amount;
        private int count;
        private boolean gstIncluded;
    }

    @Data
    @AllArgsConstructor
    public static class IncomeLineItem {
        private String date;
        private String type;
        private String from;
        private BigDecimal amount;
        private String description;
    }

    @Data
    @AllArgsConstructor
    public static class ReserveFundEntry {
        private String fundType;
        private BigDecimal collected;
        private BigDecimal released;
        private BigDecimal locked;
    }
}
