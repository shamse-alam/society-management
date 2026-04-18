package com.society.management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String username;

    @NotBlank
    private String password;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @Email
    @NotBlank
    @Column(unique = true)
    private String email;

    private String phone;

    private String address;

    private String unitNumber;

    // Multi-role: comma-separated, e.g. "RESIDENT,TREASURER"
    @Column(nullable = false)
    @Builder.Default
    private String roles = "RESIDENT";

    // Executive committee designation (display only)
    private String designation; // President, Secretary, Treasurer, Vice President, Joint Secretary, Committee Member

    private LocalDate designationSince;

    private LocalDate designationTill;

    @Builder.Default
    private boolean enabled = true;

    @Column(length = 500)
    private String profileImage;

    private String passwordResetToken;

    private LocalDateTime passwordResetTokenExpiry;

    @Transient
    public String getFullName() {
        if (firstName == null && lastName == null) return null;
        if (lastName == null || lastName.isBlank()) return firstName;
        if (firstName == null || firstName.isBlank()) return lastName;
        return firstName + " " + lastName;
    }

    @Transient
    public List<String> getRoleList() {
        if (roles == null || roles.isBlank()) return Collections.singletonList("RESIDENT");
        return Arrays.stream(roles.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    @Transient
    public boolean hasRole(String role) {
        return getRoleList().contains(role);
    }

    // Backward compat: primary role for old code
    @Transient
    public Role getRole() {
        List<String> list = getRoleList();
        // Priority: ADMIN > GUARD > ACCOUNTANT > RESIDENT
        if (list.contains("ADMIN")) return Role.ADMIN;
        if (list.contains("GUARD")) return Role.GUARD;
        if (list.contains("ACCOUNTANT")) return Role.ACCOUNTANT;
        if (list.contains("PRESIDENT")) return Role.PRESIDENT;
        if (list.contains("SECRETARY")) return Role.SECRETARY;
        if (list.contains("TREASURER")) return Role.TREASURER;
        if (list.contains("COMMITTEE_MEMBER")) return Role.COMMITTEE_MEMBER;
        return Role.RESIDENT;
    }
}
