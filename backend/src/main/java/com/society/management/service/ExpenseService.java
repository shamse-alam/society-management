package com.society.management.service;

import com.society.management.dto.*;
import com.society.management.entity.Expense;
import com.society.management.entity.Payment;
import com.society.management.entity.PaymentStatus;
import com.society.management.entity.Vendor;
import com.society.management.repository.ExpenseRepository;
import com.society.management.repository.PaymentRepository;
import com.society.management.repository.VendorRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final PaymentRepository paymentRepository;
    private final VendorRepository vendorRepository;

    public ExpenseService(ExpenseRepository expenseRepository, PaymentRepository paymentRepository,
                          VendorRepository vendorRepository) {
        this.expenseRepository = expenseRepository;
        this.paymentRepository = paymentRepository;
        this.vendorRepository = vendorRepository;
    }

    public List<ExpenseResponse> getAllExpenses() {
        return expenseRepository.findAllByOrderByExpenseDateDesc().stream()
                .map(ExpenseResponse::from)
                .collect(Collectors.toList());
    }

    public ExpenseResponse createExpense(ExpenseRequest request) {
        Expense expense = Expense.builder()
                .category(request.getCategory())
                .amount(request.getAmount())
                .description(request.getDescription())
                .paidTo(request.getPaidTo())
                .expenseDate(LocalDate.parse(request.getExpenseDate()))
                .build();
        if (request.getVendorId() != null) {
            Vendor vendor = vendorRepository.findById(request.getVendorId())
                    .orElseThrow(() -> new RuntimeException("Vendor not found"));
            expense.setVendor(vendor);
        }
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    public ExpenseResponse updateExpense(Long id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        expense.setPaidTo(request.getPaidTo());
        expense.setExpenseDate(LocalDate.parse(request.getExpenseDate()));
        if (request.getVendorId() != null) {
            Vendor vendor = vendorRepository.findById(request.getVendorId())
                    .orElseThrow(() -> new RuntimeException("Vendor not found"));
            expense.setVendor(vendor);
        } else {
            expense.setVendor(null);
        }
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    public List<ExpenseResponse> getExpensesByVendor(Long vendorId) {
        return expenseRepository.findByVendorIdOrderByExpenseDateDesc(vendorId).stream()
                .map(ExpenseResponse::from).collect(Collectors.toList());
    }

    public void deleteExpense(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new RuntimeException("Expense not found");
        }
        expenseRepository.deleteById(id);
    }

    public BalanceSheetResponse getBalanceSheet(LocalDate from, LocalDate to) {
        // Income: PAID payments
        List<Payment> allPayments = paymentRepository.findAllByOrderByCreatedAtDesc();
        List<Payment> paidPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .filter(p -> {
                    if (from == null || to == null) return true;
                    LocalDate pDate = p.getPaidAt() != null ? p.getPaidAt().toLocalDate() : p.getCreatedAt().toLocalDate();
                    return !pDate.isBefore(from) && !pDate.isAfter(to);
                })
                .collect(Collectors.toList());

        // Expenses
        List<Expense> expenses;
        if (from != null && to != null) {
            expenses = expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDesc(from, to);
        } else {
            expenses = expenseRepository.findAllByOrderByExpenseDateDesc();
        }

        BigDecimal totalIncome = paidPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Income breakdown by type
        Map<String, BigDecimal> incomeByType = new LinkedHashMap<>();
        Map<String, Integer> incomeCountByType = new LinkedHashMap<>();
        for (Payment p : paidPayments) {
            String type = p.getPaymentType().name();
            incomeByType.merge(type, p.getAmount(), BigDecimal::add);
            incomeCountByType.merge(type, 1, Integer::sum);
        }
        List<BalanceSheetResponse.IncomeEntry> incomeBreakdown = new ArrayList<>();
        incomeByType.forEach((type, amount) ->
                incomeBreakdown.add(new BalanceSheetResponse.IncomeEntry(type, amount, incomeCountByType.get(type))));

        // Expense breakdown by category
        Map<String, BigDecimal> expenseByCat = new LinkedHashMap<>();
        Map<String, Integer> expenseCountByCat = new LinkedHashMap<>();
        for (Expense e : expenses) {
            expenseByCat.merge(e.getCategory(), e.getAmount(), BigDecimal::add);
            expenseCountByCat.merge(e.getCategory(), 1, Integer::sum);
        }
        List<BalanceSheetResponse.ExpenseEntry> expenseBreakdown = new ArrayList<>();
        expenseByCat.forEach((cat, amount) ->
                expenseBreakdown.add(new BalanceSheetResponse.ExpenseEntry(cat, amount, expenseCountByCat.get(cat))));

        // Line items
        List<BalanceSheetResponse.IncomeLineItem> incomeItems = paidPayments.stream()
                .map(p -> new BalanceSheetResponse.IncomeLineItem(
                        p.getPaidAt() != null ? p.getPaidAt().toLocalDate().toString() : p.getCreatedAt().toLocalDate().toString(),
                        p.getPaymentType().name(),
                        p.getUser().getFullName(),
                        p.getAmount(),
                        p.getDescription()
                ))
                .collect(Collectors.toList());

        List<ExpenseResponse> expenseItems = expenses.stream()
                .map(ExpenseResponse::from)
                .collect(Collectors.toList());

        BalanceSheetResponse res = new BalanceSheetResponse();
        res.setTotalIncome(totalIncome);
        res.setTotalExpense(totalExpense);
        res.setBalance(totalIncome.subtract(totalExpense));
        res.setIncomeBreakdown(incomeBreakdown);
        res.setExpenseBreakdown(expenseBreakdown);
        res.setIncomeItems(incomeItems);
        res.setExpenseItems(expenseItems);
        return res;
    }
}
