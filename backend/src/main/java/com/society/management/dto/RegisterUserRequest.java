package com.society.management.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class RegisterUserRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;
    @Email @NotBlank
    private String email;
    private String phone;
    private String address;
    private String unitNumber;
    private String role; // backward compat
    private List<String> roles; // multi-role
    private String designation;
    private String designationSince;
    private String designationTill;
}
