package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForumTopicRequest {
    @NotBlank
    private String title;
    private String category;
    @NotBlank
    private String content;
}
