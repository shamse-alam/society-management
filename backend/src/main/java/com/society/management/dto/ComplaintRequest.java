package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ComplaintRequest {
    @NotBlank
    private String title;
    private String description;
    @NotBlank
    private String category;
    private String priority;
}
