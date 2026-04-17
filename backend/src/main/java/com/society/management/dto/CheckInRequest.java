package com.society.management.dto;

import lombok.Data;

@Data
public class CheckInRequest {
    private String passcode; // for pre-approved visitors
    private Long visitLogId; // for checking in an approved visit
    // for walk-in approval requests (when no passcode)
    private String visitorName;
    private String visitorPhone;
    private String unitNumber;
    private String visitorType;
    private String vehicleNumber;
    private String purpose;
    private String guardNotes;
}
