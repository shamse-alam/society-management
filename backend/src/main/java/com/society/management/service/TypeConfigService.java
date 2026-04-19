package com.society.management.service;

import com.society.management.dto.*;
import com.society.management.entity.ExpenseType;
import com.society.management.entity.IncomeType;
import com.society.management.repository.ExpenseTypeRepository;
import com.society.management.repository.IncomeTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TypeConfigService {

    private final IncomeTypeRepository incomeTypeRepository;
    private final ExpenseTypeRepository expenseTypeRepository;

    public TypeConfigService(IncomeTypeRepository incomeTypeRepository,
                             ExpenseTypeRepository expenseTypeRepository) {
        this.incomeTypeRepository = incomeTypeRepository;
        this.expenseTypeRepository = expenseTypeRepository;
    }

    // ---- Income Types ----

    public List<IncomeTypeResponse> getActiveIncomeTypes() {
        return incomeTypeRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(IncomeTypeResponse::from).collect(Collectors.toList());
    }

    public List<IncomeTypeResponse> getAllIncomeTypes() {
        return incomeTypeRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(IncomeTypeResponse::from).collect(Collectors.toList());
    }

    public List<IncomeTypeResponse> getReserveFundTypes() {
        return incomeTypeRepository.findByReserveFundTrueAndActiveTrueOrderByDisplayOrderAsc().stream()
                .map(IncomeTypeResponse::from).collect(Collectors.toList());
    }

    public IncomeType getIncomeTypeByCode(String code) {
        return incomeTypeRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Income type not found: " + code));
    }

    public IncomeTypeResponse createIncomeType(IncomeTypeRequest request) {
        String code = request.getCode().toUpperCase().replaceAll("\\s+", "_");
        if (incomeTypeRepository.existsByCode(code)) {
            throw new RuntimeException("Income type code already exists: " + code);
        }
        IncomeType entity = IncomeType.builder()
                .code(code)
                .displayName(request.getDisplayName())
                .gstApplicable(request.isGstApplicable())
                .reserveFund(request.isReserveFund())
                .oneTime(request.isOneTime())
                .systemManaged(request.isSystemManaged())
                .displayOrder(request.getDisplayOrder())
                .active(request.isActive())
                .build();
        return IncomeTypeResponse.from(incomeTypeRepository.save(entity));
    }

    public IncomeTypeResponse updateIncomeType(Long id, IncomeTypeRequest request) {
        IncomeType entity = incomeTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Income type not found"));
        entity.setDisplayName(request.getDisplayName());
        entity.setGstApplicable(request.isGstApplicable());
        entity.setReserveFund(request.isReserveFund());
        entity.setOneTime(request.isOneTime());
        entity.setDisplayOrder(request.getDisplayOrder());
        entity.setActive(request.isActive());
        return IncomeTypeResponse.from(incomeTypeRepository.save(entity));
    }

    public void deleteIncomeType(Long id) {
        IncomeType entity = incomeTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Income type not found"));
        if (entity.isSystemManaged()) {
            throw new RuntimeException("Cannot delete system-managed income type: " + entity.getCode());
        }
        incomeTypeRepository.deleteById(id);
    }

    // ---- Expense Types ----

    public List<ExpenseTypeResponse> getActiveExpenseTypes() {
        return expenseTypeRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(ExpenseTypeResponse::from).collect(Collectors.toList());
    }

    public List<ExpenseTypeResponse> getAllExpenseTypes() {
        return expenseTypeRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(ExpenseTypeResponse::from).collect(Collectors.toList());
    }

    public ExpenseType getExpenseTypeByCode(String code) {
        return expenseTypeRepository.findByCode(code).orElse(null);
    }

    public ExpenseTypeResponse createExpenseType(ExpenseTypeRequest request) {
        String code = request.getCode().toUpperCase().replaceAll("\\s+", "_");
        if (expenseTypeRepository.existsByCode(code)) {
            throw new RuntimeException("Expense type code already exists: " + code);
        }
        ExpenseType entity = ExpenseType.builder()
                .code(code)
                .displayName(request.getDisplayName())
                .gstIncluded(request.isGstIncluded())
                .displayOrder(request.getDisplayOrder())
                .active(request.isActive())
                .build();
        return ExpenseTypeResponse.from(expenseTypeRepository.save(entity));
    }

    public ExpenseTypeResponse updateExpenseType(Long id, ExpenseTypeRequest request) {
        ExpenseType entity = expenseTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense type not found"));
        entity.setDisplayName(request.getDisplayName());
        entity.setGstIncluded(request.isGstIncluded());
        entity.setDisplayOrder(request.getDisplayOrder());
        entity.setActive(request.isActive());
        return ExpenseTypeResponse.from(expenseTypeRepository.save(entity));
    }

    public void deleteExpenseType(Long id) {
        expenseTypeRepository.deleteById(id);
    }
}
