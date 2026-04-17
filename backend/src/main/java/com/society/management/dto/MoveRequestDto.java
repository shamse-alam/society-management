package com.society.management.dto;

import lombok.Data;

@Data
public class MoveRequestDto {
    private String moveType; // MOVE_IN, MOVE_OUT
    private String scheduledDate;
    private String timeSlot;
    private String vehicleDetails;
    private String moversCompany;
    private String moversPhone;
    private String notes;
}
