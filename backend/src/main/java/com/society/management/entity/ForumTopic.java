package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "forum_topics")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ForumTopic {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String category; // GENERAL, MAINTENANCE, SECURITY, EVENTS, SUGGESTIONS, OTHER

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Builder.Default
    private boolean pinned = false;
    @Builder.Default
    private boolean locked = false;
    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private int replyCount = 0;

    @Builder.Default
    private LocalDateTime lastActivityAt = LocalDateTime.now();
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
