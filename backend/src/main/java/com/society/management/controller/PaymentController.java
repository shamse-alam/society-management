package com.society.management.controller;

import com.society.management.dto.*;
import com.society.management.service.AmenityBookingService;
import com.society.management.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class PaymentController {

    private final PaymentService paymentService;
    private final AmenityBookingService bookingService;

    public PaymentController(PaymentService paymentService, AmenityBookingService bookingService) {
        this.paymentService = paymentService;
        this.bookingService = bookingService;
    }

    // ---- Payments ----

    @PostMapping("/payments")
    public ResponseEntity<PaymentResponse> makePayment(@AuthenticationPrincipal UserDetails userDetails,
                                                        @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.makePayment(request, userDetails.getUsername()));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<PaymentResponse>> getMyPayments(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(paymentService.getMyPayments(userDetails.getUsername()));
    }

    @GetMapping("/payments/type/{type}")
    public ResponseEntity<List<PaymentResponse>> getMyPaymentsByType(@AuthenticationPrincipal UserDetails userDetails,
                                                                      @PathVariable String type) {
        return ResponseEntity.ok(paymentService.getMyPaymentsByType(userDetails.getUsername(), type));
    }

    // ---- Amenities ----

    @GetMapping("/amenities")
    public ResponseEntity<List<AmenityResponse>> getAmenities() {
        return ResponseEntity.ok(bookingService.getAllAmenities());
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingResponse> createBooking(@AuthenticationPrincipal UserDetails userDetails,
                                                          @Valid @RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request, userDetails.getUsername()));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.getMyBookings(userDetails.getUsername()));
    }

}
