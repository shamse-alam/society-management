package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "move_requests")
@Getter @Setter @NoArgsConstructor
@AllArgsConstructor @SuperBuilder
public class MoveRequest extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id")
    private Property property;

    @Enumerated(EnumType.STRING)
    private MoveType moveType;

    private LocalDate scheduledDate;
    private String timeSlot;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MoveRequestStatus status = MoveRequestStatus.PENDING;

    private String vehicleDetails;
    private String moversCompany;
    private String moversPhone;
    private String adminRemarks;
    private boolean nocIssued;
    private LocalDate nocIssuedDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;
}
