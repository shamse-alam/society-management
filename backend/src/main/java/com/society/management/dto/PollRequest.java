package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class PollRequest {
    @NotBlank
    private String question;
    private String description;
    private Boolean multipleChoice;
    @NotEmpty
    private List<String> options;
    private String expiresAt;
    private Boolean active;
}
