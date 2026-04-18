package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "parking_slots")
@Getter @Setter @NoArgsConstructor
@AllArgsConstructor @SuperBuilder
public class ParkingSlot extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slotNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParkingSlotType slotType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_property_id")
    private Property assignedProperty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_vehicle_id")
    private Vehicle assignedVehicle;

    private String zone;

    @Builder.Default
    private boolean occupied = false;

    @Builder.Default
    private boolean active = true;
}
