package com.society.management.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(name = "forum_topics")
@Getter @Setter @NoArgsConstructor
@SuperBuilder
public class ForumTopic extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

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
}
