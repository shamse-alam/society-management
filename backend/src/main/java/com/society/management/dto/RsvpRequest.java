package com.society.management.dto;

import lombok.Data;

@Data
public class RsvpRequest {
    private String status; // GOING, NOT_GOING, MAYBE
    private int guestCount;
    private String notes;
}
