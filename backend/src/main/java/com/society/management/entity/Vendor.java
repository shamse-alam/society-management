package com.society.management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vendors")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class Vendor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotBlank
    private String category;

    private String phone;

    private String email;

    private String address;

    @Column(length = 500)
    private String logoImage;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VendorType vendorType = VendorType.OTHER;

    @Column(precision = 10, scale = 2)
    private BigDecimal monthlyAmount;

    private LocalDate contractStartDate;

    private LocalDate contractEndDate;

    private String gstNumber;

    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VendorBankAccount> bankAccounts = new ArrayList<>();

    @Builder.Default
    private Boolean active = true;
}
