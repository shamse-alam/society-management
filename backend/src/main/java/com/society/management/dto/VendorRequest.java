package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
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

    private String vendorType;
    private BigDecimal monthlyAmount;
    private String contractStartDate;
    private String contractEndDate;
    private String gstNumber;
}
