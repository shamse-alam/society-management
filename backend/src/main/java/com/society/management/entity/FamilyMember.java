package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "family_members")
@Getter @Setter @NoArgsConstructor
@AllArgsConstructor @SuperBuilder
public class FamilyMember extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by_user_id", nullable = false)
    private User addedBy;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String relation;

    private String phone;
    private String email;
    private String photoUrl;

    @Builder.Default
    private boolean canApproveVisitors = true;

    @Builder.Default
    private boolean active = true;
}
