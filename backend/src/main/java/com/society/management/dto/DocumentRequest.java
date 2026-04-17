package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DocumentRequest {
    @NotBlank
    private String title;
    private String description;
    @NotBlank
    private String category;
}
