package com.society.management.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingRequest {
    private Long userId;

    @NotNull
    private Long amenityId;

    @NotNull
    private String bookingDate;

    @NotNull
    private String bookingEndDate;

    private String purpose;
}
