package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType paymentType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PAID;

    private LocalDate periodFrom;
    private LocalDate periodTo;

    private String description;

    private String receiptNumber;

    private Long bookingId;

    private LocalDate dueDate;

    @Builder.Default
    @Column(precision = 10, scale = 2)
    private BigDecimal penaltyAmount = BigDecimal.ZERO;

    @Builder.Default
    private boolean penaltyApplied = false;

    @Builder.Default
    private LocalDateTime paidAt = LocalDateTime.now();
}
