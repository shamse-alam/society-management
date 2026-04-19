package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "visitors")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class Visitor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VisitorType visitorType = VisitorType.GUEST;

    private String email;

    private String vehicleNumber;

    @Column(length = 500)
    private String photo;
}
