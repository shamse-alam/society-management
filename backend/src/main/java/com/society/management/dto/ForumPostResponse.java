package com.society.management.dto;

import com.society.management.entity.ForumPost;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ForumPostResponse {
    private Long id;
    private Long topicId;
    private String authorName;
    private String content;
    private boolean originalPost;
    private LocalDateTime createdAt;

    public static ForumPostResponse from(ForumPost p) {
        ForumPostResponse r = new ForumPostResponse();
        r.setId(p.getId());
        r.setTopicId(p.getTopic() != null ? p.getTopic().getId() : null);
        r.setAuthorName(p.getAuthor() != null ? p.getAuthor().getFullName() : null);
        r.setContent(p.getContent());
        r.setOriginalPost(p.isOriginalPost());
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }
}
