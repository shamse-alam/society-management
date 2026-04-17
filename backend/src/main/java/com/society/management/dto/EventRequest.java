package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EventRequest {
    @NotBlank
    private String title;
    private String description;
    private String venue;
    private String category;
    private String startTime;
    private String endTime;
    private String status;
    private Integer maxAttendees;
}
