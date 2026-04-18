package com.society.management.repository;

import com.society.management.entity.Expense;
import com.society.management.entity.ExpenseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findAllByOrderByExpenseDateDesc();
    List<Expense> findByExpenseDateBetweenOrderByExpenseDateDesc(LocalDate from, LocalDate to);
    List<Expense> findByVendorIdOrderByExpenseDateDesc(Long vendorId);
    List<Expense> findByStatusOrderByExpenseDateDesc(ExpenseStatus status);
    List<Expense> findByVendorIdAndExpenseDateBetween(Long vendorId, LocalDate from, LocalDate to);
    List<Expense> findByStatusAndExpenseDateBetweenOrderByExpenseDateDesc(ExpenseStatus status, LocalDate from, LocalDate to);
    Optional<Expense> findTopByVoucherNumberStartingWithOrderByVoucherNumberDesc(String prefix);
}
