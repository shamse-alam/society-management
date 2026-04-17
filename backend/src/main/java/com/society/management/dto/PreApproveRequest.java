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
    private String visitorType; // GUEST, DELIVERY, CAB, OTHER
    private String vehicleNumber;
    private String purpose;
    @NotNull
    private LocalDateTime expectedAt;
    private LocalDateTime validUntil; // defaults to expectedAt + 4 hours
}
