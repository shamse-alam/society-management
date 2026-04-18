package com.society.management.dto;

import com.society.management.entity.User;
import lombok.Data;

import java.util.List;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String unitNumber;
    private String role; // primary role (backward compat)
    private List<String> roles; // all roles
    private boolean enabled;
    private String profileImage;
    private String createdAt;
    private String passwordResetLink;
    private boolean emailSent;
    private String designation;
    private String designationSince;
    private String designationTill;

    public static UserResponse from(User user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setUsername(user.getUsername());
        r.setFirstName(user.getFirstName());
        r.setLastName(user.getLastName());
        r.setFullName(user.getFullName());
        r.setEmail(user.getEmail());
        r.setPhone(user.getPhone());
        r.setAddress(user.getAddress());
        r.setUnitNumber(user.getUnitNumber());
        r.setRole(user.getRole().name());
        r.setRoles(user.getRoleList());
        r.setEnabled(user.isEnabled());
        r.setProfileImage(user.getProfileImage());
        r.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        r.setDesignation(user.getDesignation());
        r.setDesignationSince(user.getDesignationSince() != null ? user.getDesignationSince().toString() : null);
        r.setDesignationTill(user.getDesignationTill() != null ? user.getDesignationTill().toString() : null);
        return r;
    }
}
