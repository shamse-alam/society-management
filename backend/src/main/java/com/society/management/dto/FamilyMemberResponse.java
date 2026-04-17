package com.society.management.dto;

import com.society.management.entity.FamilyMember;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FamilyMemberResponse {
    private Long id;
    private String name;
    private String relation;
    private String phone;
    private String email;
    private String photoUrl;
    private String unitNumber;
    private String addedByName;
    private boolean canApproveVisitors;
    private boolean active;
    private LocalDateTime createdAt;

    public static FamilyMemberResponse from(FamilyMember fm) {
        FamilyMemberResponse r = new FamilyMemberResponse();
        r.setId(fm.getId());
        r.setName(fm.getName());
        r.setRelation(fm.getRelation());
        r.setPhone(fm.getPhone());
        r.setEmail(fm.getEmail());
        r.setPhotoUrl(fm.getPhotoUrl());
        r.setUnitNumber(fm.getProperty() != null ? fm.getProperty().getUnitNumber() : null);
        r.setAddedByName(fm.getAddedBy() != null ? fm.getAddedBy().getFullName() : null);
        r.setCanApproveVisitors(fm.isCanApproveVisitors());
        r.setActive(fm.isActive());
        r.setCreatedAt(fm.getCreatedAt());
        return r;
    }
}
