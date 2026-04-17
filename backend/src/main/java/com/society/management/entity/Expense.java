package com.society.management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String category; // e.g. ELECTRICITY, WATER, SECURITY, MAINTENANCE, SALARY, OTHER

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    private String description;

    private String paidTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    @Column(nullable = false)
    private LocalDate expenseDate;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
