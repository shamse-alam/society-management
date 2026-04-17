package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ComplaintUpdateRequest {
    @NotBlank
    private String status;
    private String adminRemarks;
}
