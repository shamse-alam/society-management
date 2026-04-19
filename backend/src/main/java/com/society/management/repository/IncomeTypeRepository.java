package com.society.management.repository;

import com.society.management.entity.IncomeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IncomeTypeRepository extends JpaRepository<IncomeType, Long> {
    Optional<IncomeType> findByCode(String code);
    List<IncomeType> findByActiveTrueOrderByDisplayOrderAsc();
    List<IncomeType> findByReserveFundTrueAndActiveTrueOrderByDisplayOrderAsc();
    List<IncomeType> findAllByOrderByDisplayOrderAsc();
    boolean existsByCode(String code);
}
