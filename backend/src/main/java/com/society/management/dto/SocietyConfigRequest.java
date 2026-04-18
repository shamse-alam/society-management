package com.society.management.dto;

import lombok.Data;

import java.util.List;

@Data
public class SocietyConfigRequest {
    private String societyName;
    private String tagline;
    private String address;
    private String phone;
    private String email;
    private String gstin;
    private String registrationNumber;
    private List<String> propertyTypes;
    private String propertyLabel;
    private List<String> expenseApprovalRoles;
    private Integer expenseApprovalCount;
}
