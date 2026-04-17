package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FamilyMemberRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String relation;
    private String phone;
    private String email;
    private String unitNumber;
    private boolean canApproveVisitors = true;
}
