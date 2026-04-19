package com.society.management.controller;

import com.society.management.dto.*;
import com.society.management.security.PermissionService;
import com.society.management.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;
    private final UserService userService;
    private final PropertyService propertyService;
    private final PaymentService paymentService;
    private final AmenityBookingService bookingService;
    private final ExpenseService expenseService;
    private final VendorService vendorService;
    private final NoticeService noticeService;
    private final ComplaintService complaintService;
    private final PollService pollService;
    private final VisitorService visitorService;

    private final EmergencyContactService emergencyContactService;
    private final FamilyMemberService familyMemberService;
    private final ParkingService parkingService;
    private final DocumentService documentService;
    private final ForumService forumService;
    private final EventService eventService;
    private final MoveService moveService;
    private final SocietyConfigService societyConfigService;
    private final PermissionService permissionService;
    private final FundReleaseService fundReleaseService;
    private final TypeConfigService typeConfigService;
    private final DataCleanupService dataCleanupService;
    private final PaymentRefundService paymentRefundService;

    public AdminController(AuthService authService, UserService userService, PropertyService propertyService,
                           PaymentService paymentService, AmenityBookingService bookingService,
                           ExpenseService expenseService, VendorService vendorService,
                           NoticeService noticeService, ComplaintService complaintService,
                           PollService pollService, VisitorService visitorService,
                           EmergencyContactService emergencyContactService,
                           FamilyMemberService familyMemberService,
                           ParkingService parkingService,
                           DocumentService documentService,
                           ForumService forumService,
                           EventService eventService,
                           MoveService moveService,
                           SocietyConfigService societyConfigService,
                           PermissionService permissionService,
                           FundReleaseService fundReleaseService,
                           TypeConfigService typeConfigService,
                           DataCleanupService dataCleanupService,
                           PaymentRefundService paymentRefundService) {
        this.authService = authService;
        this.userService = userService;
        this.propertyService = propertyService;
        this.paymentService = paymentService;
        this.bookingService = bookingService;
        this.expenseService = expenseService;
        this.vendorService = vendorService;
        this.noticeService = noticeService;
        this.complaintService = complaintService;
        this.pollService = pollService;
        this.visitorService = visitorService;
        this.emergencyContactService = emergencyContactService;
        this.familyMemberService = familyMemberService;
        this.parkingService = parkingService;
        this.documentService = documentService;
        this.forumService = forumService;
        this.eventService = eventService;
        this.moveService = moveService;
        this.societyConfigService = societyConfigService;
        this.permissionService = permissionService;
        this.fundReleaseService = fundReleaseService;
        this.typeConfigService = typeConfigService;
        this.dataCleanupService = dataCleanupService;
        this.paymentRefundService = paymentRefundService;
    }

    // ---- User Management ----

    @PostMapping("/users")
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody RegisterUserRequest request) {
        return ResponseEntity.ok(authService.registerUser(request));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/committee")
    public ResponseEntity<List<UserResponse>> getCommitteeMembers() {
        return ResponseEntity.ok(userService.getCommitteeMembers());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
    }

    @PutMapping("/users/{id}/reset-password")
    public ResponseEntity<MessageResponse> adminResetPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        userService.adminResetPassword(id, body.get("newPassword"));
        return ResponseEntity.ok(new MessageResponse("Password reset successfully"));
    }

    @PostMapping("/users/{id}/profile-image")
    public ResponseEntity<UserResponse> uploadProfileImage(@PathVariable Long id,
                                                            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadProfileImage(id, file));
    }

    // ---- Property Management ----

    @PostMapping("/properties")
    public ResponseEntity<PropertyResponse> createProperty(@Valid @RequestBody PropertyRequest request) {
        return ResponseEntity.ok(propertyService.createProperty(request));
    }

    @GetMapping("/properties")
    public ResponseEntity<List<PropertyResponse>> getAllProperties() {
        return ResponseEntity.ok(propertyService.getAllProperties());
    }

    @GetMapping("/properties/{id}")
    public ResponseEntity<PropertyDetailResponse> getProperty(@PathVariable Long id) {
        return ResponseEntity.ok(propertyService.getPropertyDetail(id));
    }

    @PutMapping("/properties/{id}")
    public ResponseEntity<PropertyResponse> updateProperty(@PathVariable Long id, @Valid @RequestBody PropertyRequest request) {
        return ResponseEntity.ok(propertyService.updateProperty(id, request));
    }

    @DeleteMapping("/properties/{id}")
    public ResponseEntity<MessageResponse> deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.ok(new MessageResponse("Property deleted successfully"));
    }

    @GetMapping("/properties/status/{status}")
    public ResponseEntity<List<PropertyResponse>> getPropertiesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(propertyService.getPropertiesByStatus(status));
    }

    // ---- Payments (Admin) ----

    @PostMapping("/payments")
    public ResponseEntity<PaymentResponse> recordPayment(@AuthenticationPrincipal UserDetails userDetails,
                                                          @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.makePayment(request, userDetails.getUsername()));
    }

    @PutMapping("/payments/{id}")
    public ResponseEntity<PaymentResponse> updatePayment(@PathVariable Long id,
                                                          @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.updatePayment(id, request));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/payments/type/{type}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByType(@PathVariable String type) {
        return ResponseEntity.ok(paymentService.getAllPaymentsByType(type));
    }

    @GetMapping("/payments/user/{userId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(paymentService.getPaymentsByUser(userId));
    }

    @GetMapping("/payments/{id}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @DeleteMapping("/payments/{id}")
    public ResponseEntity<MessageResponse> deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.ok(new MessageResponse("Payment deleted successfully"));
    }

    @PostMapping("/payments/{id}/record-receipt")
    public ResponseEntity<PaymentResponse> recordReceipt(@PathVariable Long id,
                                                          @RequestBody Map<String, Object> body) {
        java.math.BigDecimal amount = new java.math.BigDecimal(body.get("amount").toString());
        return ResponseEntity.ok(paymentService.recordReceipt(id, amount));
    }

    // ---- Invoices ----

    @PostMapping("/invoices/generate")
    public ResponseEntity<Map<String, Object>> generateInvoices(@Valid @RequestBody InvoiceGenerationRequest request) {
        return ResponseEntity.ok(paymentService.generateInvoices(request));
    }

    @PostMapping("/invoices/apply-penalties")
    public ResponseEntity<Map<String, Object>> applyPenalties(@Valid @RequestBody PenaltyRequest request) {
        return ResponseEntity.ok(paymentService.applyPenalties(request));
    }

    // ---- Bookings (Admin) ----

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/amenities")
    public ResponseEntity<List<AmenityResponse>> getAmenities() {
        return ResponseEntity.ok(bookingService.getAllAmenities());
    }

    @PostMapping("/amenities")
    public ResponseEntity<AmenityResponse> createAmenity(@Valid @RequestBody AmenityRequest request) {
        return ResponseEntity.ok(bookingService.createAmenity(request));
    }

    @PutMapping("/amenities/{id}")
    public ResponseEntity<AmenityResponse> updateAmenity(@PathVariable Long id, @Valid @RequestBody AmenityRequest request) {
        return ResponseEntity.ok(bookingService.updateAmenity(id, request));
    }

    @DeleteMapping("/amenities/{id}")
    public ResponseEntity<MessageResponse> deleteAmenity(@PathVariable Long id) {
        bookingService.deleteAmenity(id);
        return ResponseEntity.ok(new MessageResponse("Amenity deleted successfully"));
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingResponse> createBookingAdmin(@AuthenticationPrincipal UserDetails userDetails,
                                                               @Valid @RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request, userDetails.getUsername()));
    }

    @PutMapping("/bookings/{id}/confirm")
    public ResponseEntity<BookingResponse> confirmBookingAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.confirmBooking(id));
    }

    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBookingAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    // ---- Expenses ----

    @GetMapping("/expenses")
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses() {
        return ResponseEntity.ok(expenseService.getAllExpenses());
    }

    @PostMapping("/expenses")
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.createExpense(request));
    }

    @PutMapping("/expenses/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.updateExpense(id, request));
    }

    @DeleteMapping("/expenses/{id}")
    public ResponseEntity<MessageResponse> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.ok(new MessageResponse("Expense deleted successfully"));
    }

    @GetMapping("/expenses/vendor/{vendorId}")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByVendor(@PathVariable Long vendorId) {
        return ResponseEntity.ok(expenseService.getExpensesByVendor(vendorId));
    }

    @GetMapping("/expenses/status/{status}")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(expenseService.getExpensesByStatus(status));
    }

    @PutMapping("/expenses/{id}/approve")
    public ResponseEntity<ExpenseResponse> approveExpense(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(expenseService.approveExpense(id, userDetails.getUsername()));
    }

    @PutMapping("/expenses/{id}/pay")
    public ResponseEntity<ExpenseResponse> markExpensePaid(@PathVariable Long id,
            @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.markAsPaid(id, request));
    }

    @PutMapping("/expenses/{id}/cancel")
    public ResponseEntity<ExpenseResponse> cancelExpense(@PathVariable Long id) {
        return ResponseEntity.ok(expenseService.cancelExpense(id));
    }

    @PostMapping("/expenses/generate-monthly")
    public ResponseEntity<List<ExpenseResponse>> generateMonthlyVouchers(
            @RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(expenseService.generateMonthlyVouchers(year, month));
    }

    @PostMapping("/expenses/{id}/bill")
    public ResponseEntity<ExpenseResponse> uploadBill(@PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(expenseService.uploadBillAttachment(id, file));
    }

    // ---- Vendors ----

    @GetMapping("/vendors")
    public ResponseEntity<List<VendorResponse>> getAllVendors() {
        return ResponseEntity.ok(vendorService.getAllVendors());
    }

    @GetMapping("/vendors/active")
    public ResponseEntity<List<VendorResponse>> getActiveVendors() {
        return ResponseEntity.ok(vendorService.getActiveVendors());
    }

    @GetMapping("/vendors/{id}")
    public ResponseEntity<VendorResponse> getVendor(@PathVariable Long id) {
        return ResponseEntity.ok(vendorService.getVendorById(id));
    }

    @GetMapping("/vendors/type/{type}")
    public ResponseEntity<List<VendorResponse>> getVendorsByType(@PathVariable String type) {
        return ResponseEntity.ok(vendorService.getVendorsByType(type));
    }

    @PostMapping("/vendors")
    public ResponseEntity<VendorResponse> createVendor(@Valid @RequestBody VendorRequest request) {
        return ResponseEntity.ok(vendorService.createVendor(request));
    }

    @PutMapping("/vendors/{id}")
    public ResponseEntity<VendorResponse> updateVendor(@PathVariable Long id, @Valid @RequestBody VendorRequest request) {
        return ResponseEntity.ok(vendorService.updateVendor(id, request));
    }

    @DeleteMapping("/vendors/{id}")
    public ResponseEntity<MessageResponse> deleteVendor(@PathVariable Long id) {
        vendorService.deleteVendor(id);
        return ResponseEntity.ok(new MessageResponse("Vendor deleted successfully"));
    }

    @PostMapping("/vendors/{id}/logo")
    public ResponseEntity<VendorResponse> uploadVendorLogo(@PathVariable Long id,
                                                            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(vendorService.uploadLogo(id, file));
    }

    // ---- Notices ----

    @GetMapping("/notices")
    public ResponseEntity<List<NoticeResponse>> getAllNotices() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @PostMapping("/notices")
    public ResponseEntity<NoticeResponse> createNotice(@AuthenticationPrincipal UserDetails userDetails,
                                                        @Valid @RequestBody NoticeRequest request) {
        return ResponseEntity.ok(noticeService.createNotice(request, userDetails.getUsername()));
    }

    @PutMapping("/notices/{id}")
    public ResponseEntity<NoticeResponse> updateNotice(@PathVariable Long id, @Valid @RequestBody NoticeRequest request) {
        return ResponseEntity.ok(noticeService.updateNotice(id, request));
    }

    @DeleteMapping("/notices/{id}")
    public ResponseEntity<MessageResponse> deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.ok(new MessageResponse("Notice deleted successfully"));
    }

    // ---- Complaints ----

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @PutMapping("/complaints/{id}")
    public ResponseEntity<ComplaintResponse> updateComplaint(@PathVariable Long id,
                                                              @Valid @RequestBody ComplaintUpdateRequest request) {
        return ResponseEntity.ok(complaintService.updateComplaintStatus(id, request));
    }

    @GetMapping("/complaints/stats")
    public ResponseEntity<Map<String, Long>> getComplaintStats() {
        return ResponseEntity.ok(complaintService.getComplaintStats());
    }

    // ---- Polls ----

    @GetMapping("/polls")
    public ResponseEntity<List<PollResponse>> getAllPolls(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(pollService.getAllPolls(userDetails.getUsername()));
    }

    @PostMapping("/polls")
    public ResponseEntity<PollResponse> createPoll(@AuthenticationPrincipal UserDetails userDetails,
                                                    @Valid @RequestBody PollRequest request) {
        return ResponseEntity.ok(pollService.createPoll(request, userDetails.getUsername()));
    }

    @PutMapping("/polls/{id}/toggle")
    public ResponseEntity<PollResponse> togglePoll(@PathVariable Long id) {
        return ResponseEntity.ok(pollService.togglePollActive(id));
    }

    @DeleteMapping("/polls/{id}")
    public ResponseEntity<MessageResponse> deletePoll(@PathVariable Long id) {
        pollService.deletePoll(id);
        return ResponseEntity.ok(new MessageResponse("Poll deleted successfully"));
    }

    // ---- Visitors ----

    @GetMapping("/visitors")
    public ResponseEntity<List<VisitLogResponse>> getAllVisitLogs() {
        return ResponseEntity.ok(visitorService.getAllVisitLogs());
    }

    @GetMapping("/visitors/stats")
    public ResponseEntity<VisitorStatsResponse> getVisitorStats() {
        return ResponseEntity.ok(visitorService.getTodayStats());
    }

    @GetMapping("/visitors/analytics")
    public ResponseEntity<VisitorAnalyticsResponse> getVisitorAnalytics(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate fromDate = from != null ? LocalDate.parse(from) : LocalDate.now().minusDays(30);
        LocalDate toDate = to != null ? LocalDate.parse(to) : LocalDate.now();
        return ResponseEntity.ok(visitorService.getVisitorAnalytics(fromDate, toDate));
    }

    @GetMapping("/daily-help")
    public ResponseEntity<List<DailyHelpResponse>> getAllDailyHelp() {
        return ResponseEntity.ok(visitorService.getAllActiveDailyHelp());
    }

    @PostMapping("/daily-help/society-staff")
    public ResponseEntity<DailyHelpResponse> addSocietyStaff(@AuthenticationPrincipal UserDetails userDetails,
                                                               @Valid @RequestBody DailyHelpRequest request) {
        return ResponseEntity.ok(visitorService.addSocietyStaff(request, userDetails.getUsername()));
    }

    @PostMapping("/daily-help/{id}/photo")
    public ResponseEntity<DailyHelpResponse> uploadDailyHelpPhoto(@PathVariable Long id,
                                                                    @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(visitorService.uploadDailyHelpPhoto(id, file));
    }

    // ---- Emergency Contacts ----

    @GetMapping("/emergency-contacts")
    public ResponseEntity<List<EmergencyContactResponse>> getEmergencyContacts() {
        return ResponseEntity.ok(emergencyContactService.getAllContacts());
    }

    @PostMapping("/emergency-contacts")
    public ResponseEntity<EmergencyContactResponse> createEmergencyContact(@Valid @RequestBody EmergencyContactRequest request) {
        return ResponseEntity.ok(emergencyContactService.createContact(request));
    }

    @PutMapping("/emergency-contacts/{id}")
    public ResponseEntity<EmergencyContactResponse> updateEmergencyContact(@PathVariable Long id,
                                                                            @Valid @RequestBody EmergencyContactRequest request) {
        return ResponseEntity.ok(emergencyContactService.updateContact(id, request));
    }

    @DeleteMapping("/emergency-contacts/{id}")
    public ResponseEntity<MessageResponse> deleteEmergencyContact(@PathVariable Long id) {
        emergencyContactService.deleteContact(id);
        return ResponseEntity.ok(new MessageResponse("Emergency contact deleted successfully"));
    }

    // ---- Reports ----

    @GetMapping("/reports/defaulters")
    public ResponseEntity<List<DefaulterResponse>> getDefaulters() {
        return ResponseEntity.ok(paymentService.getDefaulters());
    }

    // ---- Balance Sheet ----

    @GetMapping("/balance-sheet")
    public ResponseEntity<BalanceSheetResponse> getBalanceSheet(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        return ResponseEntity.ok(expenseService.getBalanceSheet(fromDate, toDate));
    }

    // ---- Family Members ----

    @GetMapping("/family-members")
    public ResponseEntity<List<FamilyMemberResponse>> getFamilyMembers(@RequestParam(required = false) String unitNumber) {
        if (unitNumber != null) return ResponseEntity.ok(familyMemberService.getMembersByProperty(unitNumber));
        return ResponseEntity.ok(familyMemberService.getAllMembers());
    }

    @PostMapping("/family-members")
    public ResponseEntity<FamilyMemberResponse> addFamilyMember(@Valid @RequestBody FamilyMemberRequest request,
                                                                  @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(familyMemberService.addMember(request, userDetails.getUsername()));
    }

    @PutMapping("/family-members/{id}")
    public ResponseEntity<FamilyMemberResponse> updateFamilyMember(@PathVariable Long id, @Valid @RequestBody FamilyMemberRequest request) {
        return ResponseEntity.ok(familyMemberService.updateMember(id, request));
    }

    @DeleteMapping("/family-members/{id}")
    public ResponseEntity<Map<String, String>> deleteFamilyMember(@PathVariable Long id) {
        familyMemberService.deactivateMember(id);
        return ResponseEntity.ok(Map.of("message", "Member deactivated"));
    }

    @PostMapping("/family-members/{id}/photo")
    public ResponseEntity<FamilyMemberResponse> uploadFamilyMemberPhoto(@PathVariable Long id,
                                                                         @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(familyMemberService.uploadPhoto(id, file));
    }

    // ---- Vehicles ----

    @GetMapping("/vehicles")
    public ResponseEntity<List<VehicleResponse>> getAllVehicles(@RequestParam(required = false) String unitNumber) {
        if (unitNumber != null) return ResponseEntity.ok(parkingService.getVehiclesByProperty(unitNumber));
        return ResponseEntity.ok(parkingService.getAllVehicles());
    }

    @PostMapping("/vehicles")
    public ResponseEntity<VehicleResponse> addVehicle(@Valid @RequestBody VehicleRequest request,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(parkingService.addVehicle(request, userDetails.getUsername()));
    }

    @PutMapping("/vehicles/{id}")
    public ResponseEntity<VehicleResponse> updateVehicle(@PathVariable Long id, @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(parkingService.updateVehicle(id, request));
    }

    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<Map<String, String>> deleteVehicle(@PathVariable Long id) {
        parkingService.deactivateVehicle(id);
        return ResponseEntity.ok(Map.of("message", "Vehicle deactivated"));
    }

    // ---- Parking Slots ----

    @GetMapping("/parking-slots")
    public ResponseEntity<List<ParkingSlotResponse>> getAllParkingSlots() {
        return ResponseEntity.ok(parkingService.getAllSlots());
    }

    @GetMapping("/parking-slots/available")
    public ResponseEntity<List<ParkingSlotResponse>> getAvailableSlots() {
        return ResponseEntity.ok(parkingService.getAvailableSlots());
    }

    @PostMapping("/parking-slots")
    public ResponseEntity<ParkingSlotResponse> createParkingSlot(@Valid @RequestBody ParkingSlotRequest request) {
        return ResponseEntity.ok(parkingService.createSlot(request));
    }

    @PutMapping("/parking-slots/{id}")
    public ResponseEntity<ParkingSlotResponse> updateParkingSlot(@PathVariable Long id, @Valid @RequestBody ParkingSlotRequest request) {
        return ResponseEntity.ok(parkingService.updateSlot(id, request));
    }

    @DeleteMapping("/parking-slots/{id}")
    public ResponseEntity<Map<String, String>> deleteParkingSlot(@PathVariable Long id) {
        parkingService.deactivateSlot(id);
        return ResponseEntity.ok(Map.of("message", "Parking slot deactivated"));
    }

    // ---- Visitor Parking ----

    @GetMapping("/visitor-parking")
    public ResponseEntity<List<VisitorParkingResponse>> getAllVisitorParking() {
        return ResponseEntity.ok(parkingService.getAllVisitorParking());
    }

    // ---- Documents ----

    @GetMapping("/documents")
    public ResponseEntity<List<DocumentResponse>> getDocuments(@RequestParam(required = false) String category) {
        if (category != null) return ResponseEntity.ok(documentService.getDocumentsByCategory(category));
        return ResponseEntity.ok(documentService.getAllDocuments());
    }

    @PostMapping("/documents")
    public ResponseEntity<DocumentResponse> uploadDocument(@RequestParam("title") String title,
                                                            @RequestParam(value = "description", required = false) String description,
                                                            @RequestParam("category") String category,
                                                            @RequestParam("file") MultipartFile file,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.uploadDocument(title, description, category, file, userDetails.getUsername()));
    }

    @PutMapping("/documents/{id}")
    public ResponseEntity<DocumentResponse> updateDocument(@PathVariable Long id,
                                                            @RequestParam("title") String title,
                                                            @RequestParam(value = "description", required = false) String description,
                                                            @RequestParam("category") String category) {
        return ResponseEntity.ok(documentService.updateDocument(id, title, description, category));
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Map<String, String>> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(Map.of("message", "Document deleted"));
    }

    // ---- Forum (Admin) ----

    @PutMapping("/forum/topics/{id}/pin")
    public ResponseEntity<ForumTopicResponse> togglePinTopic(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.togglePin(id));
    }

    @PutMapping("/forum/topics/{id}/lock")
    public ResponseEntity<ForumTopicResponse> toggleLockTopic(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.toggleLock(id));
    }

    @DeleteMapping("/forum/topics/{id}")
    public ResponseEntity<Map<String, String>> deleteTopic(@PathVariable Long id) {
        forumService.deleteTopic(id);
        return ResponseEntity.ok(Map.of("message", "Topic deleted"));
    }

    @DeleteMapping("/forum/posts/{id}")
    public ResponseEntity<Map<String, String>> deleteForumPost(@PathVariable Long id) {
        forumService.deletePost(id);
        return ResponseEntity.ok(Map.of("message", "Post deleted"));
    }

    // ---- Events ----

    @GetMapping("/events")
    public ResponseEntity<List<EventResponse>> getEvents(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(eventService.getAllEvents(userDetails.getUsername()));
    }

    @PostMapping("/events")
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody EventRequest request,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(eventService.createEvent(request, userDetails.getUsername()));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<EventResponse> updateEvent(@PathVariable Long id, @Valid @RequestBody EventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Map<String, String>> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(Map.of("message", "Event deleted"));
    }

    // ---- Move Requests ----

    @GetMapping("/move-requests")
    public ResponseEntity<List<MoveRequestResponse>> getMoveRequests(@RequestParam(required = false) String status) {
        if (status != null) return ResponseEntity.ok(moveService.getRequestsByStatus(status));
        return ResponseEntity.ok(moveService.getAllRequests());
    }

    @PutMapping("/move-requests/{id}/approve")
    public ResponseEntity<MoveRequestResponse> approveMoveRequest(@PathVariable Long id,
                                                                    @RequestBody(required = false) Map<String, String> body,
                                                                    @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(moveService.approveRequest(id, body, userDetails.getUsername()));
    }

    @PutMapping("/move-requests/{id}/reject")
    public ResponseEntity<MoveRequestResponse> rejectMoveRequest(@PathVariable Long id,
                                                                   @RequestBody(required = false) Map<String, String> body,
                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(moveService.rejectRequest(id, body, userDetails.getUsername()));
    }

    @PutMapping("/move-requests/{id}/complete")
    public ResponseEntity<MoveRequestResponse> completeMoveRequest(@PathVariable Long id) {
        return ResponseEntity.ok(moveService.completeRequest(id));
    }

    // ---- Fund Releases ----

    @GetMapping("/fund-releases")
    public ResponseEntity<List<FundReleaseResponse>> getAllFundReleases() {
        return ResponseEntity.ok(fundReleaseService.getAllReleases());
    }

    @GetMapping("/fund-releases/status/{status}")
    public ResponseEntity<List<FundReleaseResponse>> getFundReleasesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(fundReleaseService.getReleasesByStatus(status));
    }

    @PostMapping("/fund-releases")
    public ResponseEntity<FundReleaseResponse> createFundRelease(
            @Valid @RequestBody FundReleaseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(fundReleaseService.createReleaseRequest(request, userDetails.getUsername()));
    }

    @PutMapping("/fund-releases/{id}/approve")
    public ResponseEntity<FundReleaseResponse> approveFundRelease(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(fundReleaseService.approveRelease(id, userDetails.getUsername()));
    }

    @PutMapping("/fund-releases/{id}/reject")
    public ResponseEntity<FundReleaseResponse> rejectFundRelease(@PathVariable Long id,
            @RequestBody FundReleaseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(fundReleaseService.rejectRelease(id, request.getRejectionReason(), userDetails.getUsername()));
    }

    @PutMapping("/fund-releases/{id}/release")
    public ResponseEntity<FundReleaseResponse> markFundReleased(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(fundReleaseService.markAsReleased(id, userDetails.getUsername()));
    }

    // ---- Society Config ----

    @GetMapping("/society-config")
    public ResponseEntity<SocietyConfigResponse> getSocietyConfig() {
        return ResponseEntity.ok(societyConfigService.getConfig());
    }

    @PutMapping("/society-config")
    public ResponseEntity<SocietyConfigResponse> updateSocietyConfig(@RequestBody SocietyConfigRequest request) {
        return ResponseEntity.ok(societyConfigService.updateConfig(request));
    }

    @PostMapping("/society-config/logo")
    public ResponseEntity<SocietyConfigResponse> uploadSocietyLogo(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(societyConfigService.uploadLogo(file));
    }

    // ---- Role & Permission Config ----

    @GetMapping("/permissions/roles")
    public ResponseEntity<Map<String, String>> getAllRoles() {
        return ResponseEntity.ok(permissionService.getAllRoles());
    }

    @GetMapping("/permissions/roles/{role}")
    public ResponseEntity<List<Map<String, Object>>> getRolePermissions(@PathVariable String role) {
        return ResponseEntity.ok(permissionService.getRolePermissions(role));
    }

    @GetMapping("/permissions")
    public ResponseEntity<Map<String, Object>> getFullPermissions() {
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        var config = permissionService.getConfig();
        result.put("roles", config.getRoles());
        result.put("public", config.getPublicEndpoints());
        return ResponseEntity.ok(result);
    }

    // ---- Income Types ----

    @GetMapping("/income-types")
    public ResponseEntity<List<IncomeTypeResponse>> getAllIncomeTypes() {
        return ResponseEntity.ok(typeConfigService.getAllIncomeTypes());
    }

    @PostMapping("/income-types")
    public ResponseEntity<IncomeTypeResponse> createIncomeType(@Valid @RequestBody IncomeTypeRequest request) {
        return ResponseEntity.ok(typeConfigService.createIncomeType(request));
    }

    @PutMapping("/income-types/{id}")
    public ResponseEntity<IncomeTypeResponse> updateIncomeType(@PathVariable Long id,
                                                                @Valid @RequestBody IncomeTypeRequest request) {
        return ResponseEntity.ok(typeConfigService.updateIncomeType(id, request));
    }

    @DeleteMapping("/income-types/{id}")
    public ResponseEntity<MessageResponse> deleteIncomeType(@PathVariable Long id) {
        typeConfigService.deleteIncomeType(id);
        return ResponseEntity.ok(new MessageResponse("Income type deleted successfully"));
    }

    // ---- Expense Types ----

    @GetMapping("/expense-types")
    public ResponseEntity<List<ExpenseTypeResponse>> getAllExpenseTypes() {
        return ResponseEntity.ok(typeConfigService.getAllExpenseTypes());
    }

    @PostMapping("/expense-types")
    public ResponseEntity<ExpenseTypeResponse> createExpenseType(@Valid @RequestBody ExpenseTypeRequest request) {
        return ResponseEntity.ok(typeConfigService.createExpenseType(request));
    }

    @PutMapping("/expense-types/{id}")
    public ResponseEntity<ExpenseTypeResponse> updateExpenseType(@PathVariable Long id,
                                                                  @Valid @RequestBody ExpenseTypeRequest request) {
        return ResponseEntity.ok(typeConfigService.updateExpenseType(id, request));
    }

    @DeleteMapping("/expense-types/{id}")
    public ResponseEntity<MessageResponse> deleteExpenseType(@PathVariable Long id) {
        typeConfigService.deleteExpenseType(id);
        return ResponseEntity.ok(new MessageResponse("Expense type deleted successfully"));
    }

    // ---- Payment Refunds ----

    @GetMapping("/refunds")
    public ResponseEntity<List<PaymentRefundResponse>> getAllRefunds() {
        return ResponseEntity.ok(paymentRefundService.getAllRefunds());
    }

    @GetMapping("/refunds/status/{status}")
    public ResponseEntity<List<PaymentRefundResponse>> getRefundsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(paymentRefundService.getRefundsByStatus(status));
    }

    @PostMapping("/refunds")
    public ResponseEntity<PaymentRefundResponse> createRefund(
            @Valid @RequestBody PaymentRefundRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(paymentRefundService.createRefundRequest(request, userDetails.getUsername()));
    }

    @PutMapping("/refunds/{id}/approve")
    public ResponseEntity<PaymentRefundResponse> approveRefund(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(paymentRefundService.approveRefund(id, userDetails.getUsername()));
    }

    @PutMapping("/refunds/{id}/reject")
    public ResponseEntity<PaymentRefundResponse> rejectRefund(@PathVariable Long id,
            @RequestBody PaymentRefundRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(paymentRefundService.rejectRefund(id, request.getRejectionReason(), userDetails.getUsername()));
    }

    @PutMapping("/refunds/{id}/process")
    public ResponseEntity<PaymentRefundResponse> processRefund(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(paymentRefundService.processRefund(id, userDetails.getUsername()));
    }

    // ─── Data Cleanup (ADMIN only) ─────────────────────────────────

    @DeleteMapping("/cleanup")
    public ResponseEntity<Map<String, Long>> cleanupAllData() {
        return ResponseEntity.ok(dataCleanupService.cleanupAll());
    }
}
