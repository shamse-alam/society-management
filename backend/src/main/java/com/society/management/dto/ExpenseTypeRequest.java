package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExpenseTypeRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String displayName;
    private boolean gstIncluded = true;
    private int displayOrder = 0;
    private boolean active = true;
}
