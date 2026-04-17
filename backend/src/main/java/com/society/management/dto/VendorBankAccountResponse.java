package com.society.management.dto;

import com.society.management.entity.VendorBankAccount;
import lombok.Data;

@Data
public class VendorBankAccountResponse {
    private Long id;
    private String accountHolderName;
    private String accountNumber;
    private String ifscCode;
    private String bankName;
    private String branchName;

    public static VendorBankAccountResponse from(VendorBankAccount ba) {
        VendorBankAccountResponse r = new VendorBankAccountResponse();
        r.setId(ba.getId());
        r.setAccountHolderName(ba.getAccountHolderName());
        r.setAccountNumber(ba.getAccountNumber());
        r.setIfscCode(ba.getIfscCode());
        r.setBankName(ba.getBankName());
        r.setBranchName(ba.getBranchName());
        return r;
    }
}
