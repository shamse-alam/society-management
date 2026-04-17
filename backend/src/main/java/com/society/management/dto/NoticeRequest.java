package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NoticeRequest {
    @NotBlank
    private String title;
    private String content;
    @NotBlank
    private String category;
    @NotBlank
    private String priority;
    private String attachmentUrl;
    private String expiresAt;
    private Boolean active;
}
