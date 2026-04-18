package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "amenities")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class Amenity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal chargePerDay;

    @Builder.Default
    private boolean available = true;

    @Builder.Default
    private int totalUnits = 1;
}
