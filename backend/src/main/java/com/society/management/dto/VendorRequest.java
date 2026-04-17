package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class VendorRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String category;
    private String phone;
    private String email;
    private String address;
    private Boolean active;
    private List<VendorBankAccountRequest> bankAccounts;
}
