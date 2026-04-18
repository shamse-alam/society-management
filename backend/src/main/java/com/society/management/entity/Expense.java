package com.society.management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class Expense extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    private String description;

    private String paidTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    @Column(nullable = false)
    private LocalDate expenseDate;

    @Column(unique = true)
    private String voucherNumber;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ExpenseStatus status = ExpenseStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode;

    private String chequeNumber;
    private LocalDate chequeDate;
    private String chequeBankName;

    private String transactionReference;
    private LocalDate transactionDate;

    private String approvedBy;
    private LocalDateTime approvedAt;

    @Column(length = 500)
    private String billAttachment;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
