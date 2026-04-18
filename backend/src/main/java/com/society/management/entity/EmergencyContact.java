package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "emergency_contacts")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class EmergencyContact extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    private String category;

    private String address;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private int displayOrder = 0;
}
