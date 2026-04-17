package com.society.management.dto;

import com.society.management.entity.VisitLog;
import lombok.Data;

@Data
public class PreApproveResponse {
    private Long visitLogId;
    private String passcode;
    private String visitorName;
    private String visitorPhone;
    private String expectedAt;
    private String validUntil;
    private String status;

    public static PreApproveResponse from(VisitLog vl) {
        PreApproveResponse r = new PreApproveResponse();
        r.setVisitLogId(vl.getId());
        r.setPasscode(vl.getPasscode());
        r.setVisitorName(vl.getVisitor().getName());
        r.setVisitorPhone(vl.getVisitor().getPhone());
        r.setExpectedAt(vl.getExpectedAt() != null ? vl.getExpectedAt().toString() : null);
        r.setValidUntil(vl.getValidUntil() != null ? vl.getValidUntil().toString() : null);
        r.setStatus(vl.getStatus().name());
        return r;
    }
}
