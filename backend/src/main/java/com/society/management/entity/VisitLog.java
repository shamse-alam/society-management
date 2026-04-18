package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(name = "visit_logs")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class VisitLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "visitor_id", nullable = false)
    private Visitor visitor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id")
    private Property property;

    private String purpose;

    @Column(length = 6)
    private String passcode;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VisitStatus status = VisitStatus.EXPECTED;

    private LocalDateTime expectedAt;

    private LocalDateTime validUntil;

    private LocalDateTime checkInTime;

    private LocalDateTime checkOutTime;

    private String guardNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_in_by")
    private User checkedInBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_out_by")
    private User checkedOutBy;
}
