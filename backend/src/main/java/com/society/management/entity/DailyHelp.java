package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_help")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DailyHelp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id")
    private Property property;

    @Column(nullable = false)
    private String name;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DailyHelpCategory category;

    @Column(length = 500)
    private String photo;

    @Builder.Default
    private boolean active = true;

    private LocalDate startDate;

    private LocalDate endDate;

    private String workingDays; // e.g. "MON,TUE,WED,THU,FRI"

    private String timeSlot; // e.g. "08:00-10:00"

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
