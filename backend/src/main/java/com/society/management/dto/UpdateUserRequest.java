package com.society.management.dto;

import lombok.Data;

import java.util.List;

@Data
public class UpdateUserRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String unitNumber;
    private String role; // backward compat
    private List<String> roles; // multi-role
    private Boolean enabled;
    private String designation;
    private String designationSince;
    private String designationTill;
}
