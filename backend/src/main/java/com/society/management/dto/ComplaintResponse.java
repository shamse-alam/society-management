package com.society.management.dto;

import com.society.management.entity.Complaint;
import lombok.Data;

@Data
public class ComplaintResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userUnit;
    private String title;
    private String description;
    private String category;
    private String status;
    private String priority;
    private String adminRemarks;
    private String attachmentUrl;
    private String resolvedAt;
    private String createdAt;
    private String updatedAt;

    public static ComplaintResponse from(Complaint c) {
        ComplaintResponse r = new ComplaintResponse();
        r.setId(c.getId());
        r.setUserId(c.getUser().getId());
        r.setUserName(c.getUser().getFullName());
        r.setUserUnit(c.getUser().getUnitNumber());
        r.setTitle(c.getTitle());
        r.setDescription(c.getDescription());
        r.setCategory(c.getCategory());
        r.setStatus(c.getStatus());
        r.setPriority(c.getPriority());
        r.setAdminRemarks(c.getAdminRemarks());
        r.setAttachmentUrl(c.getAttachmentUrl());
        r.setResolvedAt(c.getResolvedAt() != null ? c.getResolvedAt().toString() : null);
        r.setCreatedAt(c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
        r.setUpdatedAt(c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null);
        return r;
    }
}
