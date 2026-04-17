package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "society_config")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SocietyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String societyName;

    private String tagline;

    private String logoUrl;

    private String address;

    private String phone;

    private String email;

    private String gstin;

    private String registrationNumber;

    @Column(length = 1000)
    private String propertyTypes;

    private String propertyLabel;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
