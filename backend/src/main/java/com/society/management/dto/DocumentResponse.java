package com.society.management.dto;

import com.society.management.entity.SocietyDocument;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DocumentResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String uploadedByName;
    private boolean active;
    private LocalDateTime createdAt;

    public static DocumentResponse from(SocietyDocument d) {
        DocumentResponse r = new DocumentResponse();
        r.setId(d.getId());
        r.setTitle(d.getTitle());
        r.setDescription(d.getDescription());
        r.setCategory(d.getCategory() != null ? d.getCategory().name() : null);
        r.setFileUrl(d.getFileUrl());
        r.setFileName(d.getFileName());
        r.setFileSize(d.getFileSize());
        r.setUploadedByName(d.getUploadedBy() != null ? d.getUploadedBy().getFullName() : null);
        r.setActive(d.isActive());
        r.setCreatedAt(d.getCreatedAt());
        return r;
    }
}
