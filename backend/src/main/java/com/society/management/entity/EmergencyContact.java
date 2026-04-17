package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_contacts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EmergencyContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    private String category; // POLICE, FIRE, AMBULANCE, HOSPITAL, SOCIETY_OFFICE, OTHER

    private String address;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private int displayOrder = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
