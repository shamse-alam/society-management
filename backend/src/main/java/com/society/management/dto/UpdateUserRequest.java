package com.society.management.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String unitNumber;
    private String role;
    private Boolean enabled;
}
