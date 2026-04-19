package com.society.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PreApproveRequest {
    @NotBlank
    private String visitorName;
    @NotBlank
    private String visitorPhone;
    private String visitorEmail;
    private String visitorType; // GUEST, DELIVERY, CAB, OTHER
    private String vehicleNumber;
    private String purpose;
    private LocalDateTime expectedAt; // kept for backward compatibility
    @NotNull
    private LocalDateTime validUntil; // pre-approval expires after this time
}
