package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForumPostRequest {
    @NotBlank
    private String content;
}
