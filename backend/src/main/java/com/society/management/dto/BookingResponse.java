package com.society.management.dto;

import com.society.management.entity.AmenityBooking;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BookingResponse {
    private Long id;
    private Long userId;
    private String username;
    private String firstName;
    private String lastName;
    private String fullName;
    private String profileImage;
    private String amenityName;
    private Long amenityId;
    private String bookingDate;
    private String bookingEndDate;
    private BigDecimal totalCharge;
    private String status;
    private String paymentStatus;
    private String purpose;
    private String createdAt;

    public static BookingResponse from(AmenityBooking b) {
        BookingResponse r = new BookingResponse();
        r.setId(b.getId());
        r.setUserId(b.getUser().getId());
        r.setUsername(b.getUser().getUsername());
        r.setFirstName(b.getUser().getFirstName());
        r.setLastName(b.getUser().getLastName());
        r.setFullName(b.getUser().getFullName());
        r.setProfileImage(b.getUser().getProfileImage());
        r.setAmenityName(b.getAmenity().getName());
        r.setAmenityId(b.getAmenity().getId());
        r.setBookingDate(b.getBookingDate().toString());
        r.setBookingEndDate(b.getBookingEndDate() != null ? b.getBookingEndDate().toString() : null);
        r.setTotalCharge(b.getTotalCharge());
        r.setStatus(b.getStatus().name());
        r.setPurpose(b.getPurpose());
        r.setCreatedAt(b.getCreatedAt() != null ? b.getCreatedAt().toString() : null);
        return r;
    }
}
