package com.society.management.dto;

import com.society.management.entity.User;
import lombok.Data;

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
    private String role;
    private boolean enabled;
    private String profileImage;
    private String createdAt;
    private String passwordResetLink;

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
        r.setEnabled(user.isEnabled());
        r.setProfileImage(user.getProfileImage());
        r.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        return r;
    }
}
