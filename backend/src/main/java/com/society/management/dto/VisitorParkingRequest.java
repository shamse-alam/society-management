package com.society.management.dto;

import lombok.Data;

@Data
public class VisitorParkingRequest {
    private Long slotId;
    private String vehicleNumber;
    private String visitorName;
    private Long visitLogId;
}
