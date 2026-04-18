package com.society.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String firstName;
    private String lastName;
    private String fullName;
    private String role; // primary role (backward compat)
    private List<String> roles; // all roles
    private String profileImage;
    private String designation;
}
