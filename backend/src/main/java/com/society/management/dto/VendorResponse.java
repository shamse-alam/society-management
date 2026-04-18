package com.society.management.dto;

import com.society.management.entity.Vendor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class VendorResponse {
    private Long id;
    private String name;
    private String category;
    private String phone;
    private String email;
    private String address;
    private String logoImage;
    private Boolean active;
    private String createdAt;
    private List<VendorBankAccountResponse> bankAccounts;

    private String vendorType;
    private BigDecimal monthlyAmount;
    private String contractStartDate;
    private String contractEndDate;
    private String gstNumber;

    public static VendorResponse from(Vendor v) {
        VendorResponse r = new VendorResponse();
        r.setId(v.getId());
        r.setName(v.getName());
        r.setCategory(v.getCategory());
        r.setPhone(v.getPhone());
        r.setEmail(v.getEmail());
        r.setAddress(v.getAddress());
        r.setLogoImage(v.getLogoImage());
        r.setActive(v.getActive());
        r.setCreatedAt(v.getCreatedAt() != null ? v.getCreatedAt().toString() : null);
        r.setBankAccounts(v.getBankAccounts() != null
                ? v.getBankAccounts().stream().map(VendorBankAccountResponse::from).collect(Collectors.toList())
                : Collections.emptyList());
        r.setVendorType(v.getVendorType() != null ? v.getVendorType().name() : null);
        r.setMonthlyAmount(v.getMonthlyAmount());
        r.setContractStartDate(v.getContractStartDate() != null ? v.getContractStartDate().toString() : null);
        r.setContractEndDate(v.getContractEndDate() != null ? v.getContractEndDate().toString() : null);
        r.setGstNumber(v.getGstNumber());
        return r;
    }
}
