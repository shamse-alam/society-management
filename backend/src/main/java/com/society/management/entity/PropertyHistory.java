package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(name = "property_history")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class PropertyHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long propertyId;

    @Column(nullable = false)
    private String changeType;

    private String previousValue;
    private String newValue;

    private String previousPhone;
    private String newPhone;

    // Backward compat: changedAt maps to createdAt from BaseEntity
    @Transient
    public LocalDateTime getChangedAt() {
        return getCreatedAt();
    }
}
