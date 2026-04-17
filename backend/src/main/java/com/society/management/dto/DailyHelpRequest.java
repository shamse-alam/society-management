package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DailyHelpRequest {
    @NotBlank
    private String name;
    private String phone;
    @NotBlank
    private String category; // MAID, COOK, DRIVER, GARDENER, NANNY, TUTOR, OTHER
    private String workingDays; // e.g. "MON,TUE,WED,THU,FRI"
    private String timeSlot; // e.g. "08:00-10:00"
    private LocalDate startDate;
}
