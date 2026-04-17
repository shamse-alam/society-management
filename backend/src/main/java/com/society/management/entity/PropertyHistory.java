package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "property_history")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PropertyHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long propertyId;

    @Column(nullable = false)
    private String changeType; // OWNER_CHANGE, TENANT_CHANGE

    private String previousValue;
    private String newValue;

    // Extra detail for tenant changes
    private String previousPhone;
    private String newPhone;

    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();
}
