package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VendorBankAccountRequest {
    private Long id;
    @NotBlank
    private String accountHolderName;
    @NotBlank
    private String accountNumber;
    @NotBlank
    private String ifscCode;
    private String bankName;
    private String branchName;
}
