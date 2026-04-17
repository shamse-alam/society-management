package com.society.management.dto;

import com.society.management.entity.ForumTopic;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ForumTopicResponse {
    private Long id;
    private String title;
    private String category;
    private String createdByName;
    private boolean pinned;
    private boolean locked;
    private int replyCount;
    private LocalDateTime lastActivityAt;
    private LocalDateTime createdAt;

    public static ForumTopicResponse from(ForumTopic t) {
        ForumTopicResponse r = new ForumTopicResponse();
        r.setId(t.getId());
        r.setTitle(t.getTitle());
        r.setCategory(t.getCategory());
        r.setCreatedByName(t.getCreatedBy() != null ? t.getCreatedBy().getFullName() : null);
        r.setPinned(t.isPinned());
        r.setLocked(t.isLocked());
        r.setReplyCount(t.getReplyCount());
        r.setLastActivityAt(t.getLastActivityAt());
        r.setCreatedAt(t.getCreatedAt());
        return r;
    }
}
