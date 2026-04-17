package com.society.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String firstName;
    private String lastName;
    private String fullName;
    private String role;
    private String profileImage;
}
