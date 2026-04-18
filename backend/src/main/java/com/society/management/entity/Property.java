package com.society.management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "properties")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class Property extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "unit_number", unique = true, nullable = false)
    private String unitNumber;

    private String ownerName;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.VACANT;

    private String tenantName;

    private String tenantPhone;

    private Integer areaInSqFt;

    private String propertyType;

    private String description;
}
