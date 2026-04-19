package com.society.management.dto;

import com.society.management.entity.FundRelease;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class FundReleaseResponse {
    private Long id;
    private String fundType;
    private BigDecimal amount;
    private String reason;
    private String status;
    private String requestedBy;
    private String approvedBy;
    private String approvedAt;
    private String rejectionReason;
    private String notes;
    private String createdAt;
    private String updatedAt;

    public static FundReleaseResponse from(FundRelease fr) {
        FundReleaseResponse r = new FundReleaseResponse();
        r.setId(fr.getId());
        r.setFundType(fr.getFundType());
        r.setAmount(fr.getAmount());
        r.setReason(fr.getReason());
        r.setStatus(fr.getStatus() != null ? fr.getStatus().name() : null);
        r.setRequestedBy(fr.getRequestedBy());
        r.setApprovedBy(fr.getApprovedBy());
        r.setApprovedAt(fr.getApprovedAt() != null ? fr.getApprovedAt().toString() : null);
        r.setRejectionReason(fr.getRejectionReason());
        r.setNotes(fr.getNotes());
        r.setCreatedAt(fr.getCreatedAt() != null ? fr.getCreatedAt().toString() : null);
        r.setUpdatedAt(fr.getUpdatedAt() != null ? fr.getUpdatedAt().toString() : null);
        return r;
    }
}
