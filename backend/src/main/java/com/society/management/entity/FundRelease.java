package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fund_releases")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class FundRelease extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fundType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private FundReleaseStatus status = FundReleaseStatus.PENDING;

    private String requestedBy;

    private String approvedBy;

    private LocalDateTime approvedAt;

    @Column(length = 500)
    private String rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
