package com.society.management.controller;

import com.society.management.dto.*;
import com.society.management.service.ParkingService;
import com.society.management.service.PropertyService;
import com.society.management.service.VisitorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/guard")
public class GuardController {

    private final VisitorService visitorService;
    private final PropertyService propertyService;
    private final ParkingService parkingService;

    public GuardController(VisitorService visitorService, PropertyService propertyService, ParkingService parkingService) {
        this.visitorService = visitorService;
        this.propertyService = propertyService;
        this.parkingService = parkingService;
    }

    @GetMapping("/properties")
    public ResponseEntity<List<PropertyResponse>> getProperties() {
        return ResponseEntity.ok(propertyService.getAllProperties());
    }

    @GetMapping("/verify/{passcode}")
    public ResponseEntity<VisitLogResponse> verifyPasscode(@PathVariable String passcode) {
        return ResponseEntity.ok(visitorService.verifyPasscode(passcode));
    }

    @PostMapping("/request-approval")
    public ResponseEntity<VisitLogResponse> requestApproval(@AuthenticationPrincipal UserDetails userDetails,
                                                             @RequestBody CheckInRequest request) {
        return ResponseEntity.ok(visitorService.requestApproval(request, userDetails.getUsername()));
    }

    @GetMapping("/awaiting-approval")
    public ResponseEntity<List<VisitLogResponse>> getAwaitingApproval() {
        return ResponseEntity.ok(visitorService.getAwaitingApproval());
    }

    @PostMapping("/check-in")
    public ResponseEntity<VisitLogResponse> checkIn(@AuthenticationPrincipal UserDetails userDetails,
                                                     @RequestBody CheckInRequest request) {
        return ResponseEntity.ok(visitorService.checkIn(request, userDetails.getUsername()));
    }

    @PostMapping("/check-out")
    public ResponseEntity<VisitLogResponse> checkOut(@AuthenticationPrincipal UserDetails userDetails,
                                                      @Valid @RequestBody CheckOutRequest request) {
        return ResponseEntity.ok(visitorService.checkOut(request, userDetails.getUsername()));
    }

    @PostMapping("/deny-entry/{id}")
    public ResponseEntity<VisitLogResponse> denyEntry(@PathVariable Long id,
                                                       @AuthenticationPrincipal UserDetails userDetails,
                                                       @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("guardNotes") : null;
        return ResponseEntity.ok(visitorService.denyEntry(id, notes, userDetails.getUsername()));
    }

    @GetMapping("/expected")
    public ResponseEntity<List<VisitLogResponse>> getExpectedVisitors() {
        return ResponseEntity.ok(visitorService.getExpectedVisitors());
    }

    @GetMapping("/inside")
    public ResponseEntity<List<VisitLogResponse>> getCurrentlyInside() {
        return ResponseEntity.ok(visitorService.getCurrentlyInside());
    }

    @GetMapping("/daily-help")
    public ResponseEntity<List<DailyHelpResponse>> getDailyHelp() {
        return ResponseEntity.ok(visitorService.getAllActiveDailyHelp());
    }

    @PostMapping("/daily-help/{id}/check-in")
    public ResponseEntity<VisitLogResponse> checkInDailyHelp(@PathVariable Long id,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(visitorService.checkInDailyHelp(id, userDetails.getUsername()));
    }

    @PostMapping("/deliveries")
    public ResponseEntity<DeliveryLogResponse> logDelivery(@Valid @RequestBody DeliveryLogRequest request,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(visitorService.logDelivery(request, userDetails.getUsername()));
    }

    @GetMapping("/deliveries/pending")
    public ResponseEntity<List<DeliveryLogResponse>> getPendingDeliveries() {
        return ResponseEntity.ok(visitorService.getPendingDeliveries());
    }

    @PutMapping("/deliveries/{id}/picked-up")
    public ResponseEntity<DeliveryLogResponse> markPickedUp(@PathVariable Long id,
                                                             @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(visitorService.markDeliveryPickedUp(id, body.get("receivedBy")));
    }

    @GetMapping("/stats")
    public ResponseEntity<VisitorStatsResponse> getStats() {
        return ResponseEntity.ok(visitorService.getTodayStats());
    }

    // ---- Visitor Parking ----

    @GetMapping("/visitor-parking")
    public ResponseEntity<List<VisitorParkingResponse>> getActiveVisitorParking() {
        return ResponseEntity.ok(parkingService.getActiveVisitorParking());
    }

    @GetMapping("/visitor-parking/slots")
    public ResponseEntity<List<ParkingSlotResponse>> getAvailableVisitorSlots() {
        return ResponseEntity.ok(parkingService.getAvailableSlots());
    }

    @PostMapping("/visitor-parking/check-in")
    public ResponseEntity<VisitorParkingResponse> checkInVisitorParking(@RequestBody VisitorParkingRequest request,
                                                                         @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(parkingService.checkInVisitorParking(request, userDetails.getUsername()));
    }

    @PutMapping("/visitor-parking/{id}/check-out")
    public ResponseEntity<VisitorParkingResponse> checkOutVisitorParking(@PathVariable Long id) {
        return ResponseEntity.ok(parkingService.checkOutVisitorParking(id));
    }

    // ---- Vehicle Verify ----

    @GetMapping("/vehicles/verify/{vehicleNumber}")
    public ResponseEntity<VehicleResponse> verifyVehicle(@PathVariable String vehicleNumber) {
        return ResponseEntity.ok(parkingService.verifyVehicle(vehicleNumber));
    }
}
