package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmergencyContactRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String phone;
    private String category;
    private String address;
    private Boolean active;
    private Integer displayOrder;
}
