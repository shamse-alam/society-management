package com.society.management.controller;

import com.society.management.dto.ExpenseTypeResponse;
import com.society.management.dto.IncomeTypeResponse;
import com.society.management.dto.SocietyConfigResponse;
import com.society.management.service.SocietyConfigService;
import com.society.management.service.TypeConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final SocietyConfigService societyConfigService;
    private final TypeConfigService typeConfigService;

    public PublicController(SocietyConfigService societyConfigService, TypeConfigService typeConfigService) {
        this.societyConfigService = societyConfigService;
        this.typeConfigService = typeConfigService;
    }

    @GetMapping("/society-config")
    public ResponseEntity<SocietyConfigResponse> getSocietyConfig() {
        return ResponseEntity.ok(societyConfigService.getConfig());
    }

    @GetMapping("/income-types")
    public ResponseEntity<List<IncomeTypeResponse>> getActiveIncomeTypes() {
        return ResponseEntity.ok(typeConfigService.getActiveIncomeTypes());
    }

    @GetMapping("/expense-types")
    public ResponseEntity<List<ExpenseTypeResponse>> getActiveExpenseTypes() {
        return ResponseEntity.ok(typeConfigService.getActiveExpenseTypes());
    }
}
