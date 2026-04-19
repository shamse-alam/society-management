package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "income_types")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class IncomeType extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String displayName;

    @Builder.Default
    private boolean gstApplicable = true;

    @Builder.Default
    private boolean reserveFund = false;

    @Builder.Default
    private boolean oneTime = false;

    @Builder.Default
    private boolean systemManaged = false;

    @Builder.Default
    private int displayOrder = 0;

    @Builder.Default
    private boolean active = true;
}
