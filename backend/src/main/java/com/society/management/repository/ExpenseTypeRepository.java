package com.society.management.repository;

import com.society.management.entity.ExpenseType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExpenseTypeRepository extends JpaRepository<ExpenseType, Long> {
    Optional<ExpenseType> findByCode(String code);
    List<ExpenseType> findByActiveTrueOrderByDisplayOrderAsc();
    List<ExpenseType> findAllByOrderByDisplayOrderAsc();
    boolean existsByCode(String code);
}
