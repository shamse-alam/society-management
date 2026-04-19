package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IncomeTypeRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String displayName;
    private boolean gstApplicable = true;
    private boolean reserveFund = false;
    private boolean oneTime = false;
    private int displayOrder = 0;
    private boolean active = true;
}
