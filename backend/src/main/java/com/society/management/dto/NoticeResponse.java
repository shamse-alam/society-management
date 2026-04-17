package com.society.management.dto;

import com.society.management.entity.Notice;
import lombok.Data;

@Data
public class NoticeResponse {
    private Long id;
    private String title;
    private String content;
    private String category;
    private String priority;
    private String postedByName;
    private String attachmentUrl;
    private String expiresAt;
    private boolean active;
    private String createdAt;
    private String updatedAt;

    public static NoticeResponse from(Notice n) {
        NoticeResponse r = new NoticeResponse();
        r.setId(n.getId());
        r.setTitle(n.getTitle());
        r.setContent(n.getContent());
        r.setCategory(n.getCategory());
        r.setPriority(n.getPriority());
        r.setPostedByName(n.getPostedBy() != null ? n.getPostedBy().getFullName() : null);
        r.setAttachmentUrl(n.getAttachmentUrl());
        r.setExpiresAt(n.getExpiresAt() != null ? n.getExpiresAt().toString() : null);
        r.setActive(n.isActive());
        r.setCreatedAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
        r.setUpdatedAt(n.getUpdatedAt() != null ? n.getUpdatedAt().toString() : null);
        return r;
    }
}
