package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "visitors")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Visitor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VisitorType visitorType = VisitorType.GUEST;

    private String vehicleNumber;

    @Column(length = 500)
    private String photo;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
