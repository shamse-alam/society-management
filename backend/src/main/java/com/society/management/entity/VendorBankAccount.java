package com.society.management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "vendor_bank_accounts")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class VendorBankAccount extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @NotBlank
    private String accountHolderName;

    @NotBlank
    private String accountNumber;

    @NotBlank
    private String ifscCode;

    private String bankName;

    private String branchName;
}
