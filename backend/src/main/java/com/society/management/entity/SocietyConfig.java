package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "society_config")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class SocietyConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String societyName;

    private String tagline;

    private String logoUrl;

    private String address;

    private String phone;

    private String email;

    private String gstin;

    private String registrationNumber;

    @Column(length = 1000)
    private String propertyTypes;

    private String propertyLabel;

    // Approval config: comma-separated roles that can approve expenses
    @Column(length = 500)
    @Builder.Default
    private String expenseApprovalRoles = "PRESIDENT,SECRETARY,TREASURER";

    // Minimum approvers needed
    @Builder.Default
    private Integer expenseApprovalCount = 1;
}
