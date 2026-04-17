package com.society.management.dto;

import com.society.management.entity.EmergencyContact;
import lombok.Data;

@Data
public class EmergencyContactResponse {
    private Long id;
    private String name;
    private String phone;
    private String category;
    private String address;
    private boolean active;
    private int displayOrder;
    private String createdAt;

    public static EmergencyContactResponse from(EmergencyContact e) {
        EmergencyContactResponse r = new EmergencyContactResponse();
        r.setId(e.getId());
        r.setName(e.getName());
        r.setPhone(e.getPhone());
        r.setCategory(e.getCategory());
        r.setAddress(e.getAddress());
        r.setActive(e.isActive());
        r.setDisplayOrder(e.getDisplayOrder());
        r.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return r;
    }
}
