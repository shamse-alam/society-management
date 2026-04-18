package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "vehicles")
@Getter @Setter @NoArgsConstructor
@AllArgsConstructor @SuperBuilder
public class Vehicle extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by_user_id", nullable = false)
    private User registeredBy;

    @Column(nullable = false, unique = true)
    private String vehicleNumber;

    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    private String make;
    private String model;
    private String color;
    private String stickerNumber;

    @Builder.Default
    private boolean active = true;
}
