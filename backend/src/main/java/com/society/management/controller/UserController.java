package com.society.management.controller;

import com.society.management.dto.ChangePasswordRequest;
import com.society.management.dto.MessageResponse;
import com.society.management.dto.*;
import com.society.management.dto.UpdateUserRequest;
import com.society.management.dto.UserResponse;
import com.society.management.dto.PropertyResponse;
import com.society.management.entity.User;
import com.society.management.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.society.management.service.ComplaintService;
import com.society.management.service.EmergencyContactService;
import com.society.management.service.FamilyMemberService;
import com.society.management.service.DocumentService;
import com.society.management.service.EventService;
import com.society.management.service.ForumService;
import com.society.management.service.MoveService;
import com.society.management.service.ParkingService;
import com.society.management.service.PollService;
import com.society.management.service.NoticeService;
import com.society.management.service.UserService;
import com.society.management.service.PropertyService;
import com.society.management.service.VisitorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PropertyService propertyService;
    private final PasswordEncoder passwordEncoder;
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

    public UserController(UserRepository userRepository, UserService userService,
                          PropertyService propertyService, PasswordEncoder passwordEncoder,
                          NoticeService noticeService, ComplaintService complaintService,
                          PollService pollService, VisitorService visitorService,
                          EmergencyContactService emergencyContactService,
                          FamilyMemberService familyMemberService,
                          ParkingService parkingService,
                          DocumentService documentService,
                          ForumService forumService,
                          EventService eventService,
                          MoveService moveService) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.propertyService = propertyService;
        this.passwordEncoder = passwordEncoder;
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
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                                       @RequestBody UpdateUserRequest request) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Normal users can only update these fields (NOT username or name)
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getUnitNumber() != null) user.setUnitNumber(request.getUnitNumber());

        user = userRepository.save(user);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PostMapping("/profile-image")
    public ResponseEntity<UserResponse> uploadProfileImage(@AuthenticationPrincipal UserDetails userDetails,
                                                            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadProfileImageByUsername(userDetails.getUsername(), file));
    }

    @PutMapping("/change-password")
    public ResponseEntity<MessageResponse> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                                           @Valid @RequestBody ChangePasswordRequest request) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
    }

    @GetMapping("/properties")
    public ResponseEntity<List<PropertyResponse>> getProperties() {
        return ResponseEntity.ok(propertyService.getAllProperties());
    }

    @GetMapping("/notices")
    public ResponseEntity<List<NoticeResponse>> getActiveNotices() {
        return ResponseEntity.ok(noticeService.getActiveNotices());
    }

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(complaintService.getMyComplaints(userDetails.getUsername()));
    }

    @PostMapping("/complaints")
    public ResponseEntity<ComplaintResponse> createComplaint(@AuthenticationPrincipal UserDetails userDetails,
                                                              @Valid @RequestBody ComplaintRequest request) {
        return ResponseEntity.ok(complaintService.createComplaint(request, userDetails.getUsername()));
    }

    @PostMapping("/complaints/{id}/attachment")
    public ResponseEntity<ComplaintResponse> uploadComplaintAttachment(@PathVariable Long id,
                                                                       @RequestParam("file") MultipartFile file,
                                                                       @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(complaintService.uploadAttachment(id, file, userDetails.getUsername()));
    }

    @GetMapping("/polls")
    public ResponseEntity<List<PollResponse>> getActivePolls(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(pollService.getActivePolls(userDetails.getUsername()));
    }

    @PostMapping("/polls/{id}/vote")
    public ResponseEntity<PollResponse> votePoll(@PathVariable Long id,
                                                  @AuthenticationPrincipal UserDetails userDetails,
                                                  @Valid @RequestBody PollVoteRequest request) {
        return ResponseEntity.ok(pollService.vote(id, request, userDetails.getUsername()));
    }

    // ---- Visitor Pre-Approval ----

    @PostMapping("/visitors/pre-approve")
    public ResponseEntity<PreApproveResponse> preApproveVisitor(@AuthenticationPrincipal UserDetails userDetails,
                                                                 @Valid @RequestBody PreApproveRequest request) {
        return ResponseEntity.ok(visitorService.preApproveVisitor(request, userDetails.getUsername()));
    }

    @GetMapping("/visitors/my-approvals")
    public ResponseEntity<List<PreApproveResponse>> getMyApprovals(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(visitorService.getMyApprovals(userDetails.getUsername()));
    }

    @GetMapping("/visitors/history")
    public ResponseEntity<List<VisitLogResponse>> getVisitHistory(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(visitorService.getVisitHistory(userDetails.getUsername()));
    }

    @DeleteMapping("/visitors/{id}")
    public ResponseEntity<MessageResponse> cancelApproval(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        visitorService.cancelApproval(id, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Approval cancelled"));
    }

    @GetMapping("/visitors/pending-approvals")
    public ResponseEntity<List<VisitLogResponse>> getPendingApprovals(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(visitorService.getPendingApprovals(userDetails.getUsername()));
    }

    @PutMapping("/visitors/{id}/approve")
    public ResponseEntity<VisitLogResponse> approveVisit(@PathVariable Long id,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(visitorService.approveVisit(id, userDetails.getUsername()));
    }

    @PutMapping("/visitors/{id}/reject")
    public ResponseEntity<VisitLogResponse> rejectVisit(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(visitorService.rejectVisit(id, userDetails.getUsername()));
    }

    // ---- Daily Help ----

    @PostMapping("/daily-help")
    public ResponseEntity<DailyHelpResponse> addDailyHelp(@AuthenticationPrincipal UserDetails userDetails,
                                                           @Valid @RequestBody DailyHelpRequest request) {
        return ResponseEntity.ok(visitorService.addDailyHelp(request, userDetails.getUsername()));
    }

    @GetMapping("/daily-help")
    public ResponseEntity<List<DailyHelpResponse>> getMyDailyHelp(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(visitorService.getMyDailyHelp(userDetails.getUsername()));
    }

    @PutMapping("/daily-help/{id}/deactivate")
    public ResponseEntity<MessageResponse> deactivateDailyHelp(@PathVariable Long id,
                                                                @AuthenticationPrincipal UserDetails userDetails) {
        visitorService.deactivateDailyHelp(id, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Daily help deactivated"));
    }

    // ---- Deliveries ----

    @GetMapping("/deliveries")
    public ResponseEntity<List<DeliveryLogResponse>> getMyDeliveries(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(visitorService.getMyDeliveries(userDetails.getUsername()));
    }

    // ---- Emergency Contacts & SOS ----

    @GetMapping("/emergency-contacts")
    public ResponseEntity<List<EmergencyContactResponse>> getEmergencyContacts() {
        return ResponseEntity.ok(emergencyContactService.getActiveContacts());
    }

    @PostMapping("/sos")
    public ResponseEntity<MessageResponse> triggerSOS(@AuthenticationPrincipal UserDetails userDetails) {
        emergencyContactService.triggerSOS(userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("SOS alert sent to all admins"));
    }

    // ---- Family Members ----

    @GetMapping("/family-members")
    public ResponseEntity<List<FamilyMemberResponse>> getMyHousehold(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(familyMemberService.getMyHousehold(userDetails.getUsername()));
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
    public ResponseEntity<java.util.Map<String, String>> deleteFamilyMember(@PathVariable Long id) {
        familyMemberService.deactivateMember(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Member deactivated"));
    }

    @PostMapping("/family-members/{id}/photo")
    public ResponseEntity<FamilyMemberResponse> uploadFamilyMemberPhoto(@PathVariable Long id,
                                                                         @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(familyMemberService.uploadPhoto(id, file));
    }

    // ---- Vehicles ----

    @GetMapping("/vehicles")
    public ResponseEntity<List<VehicleResponse>> getMyVehicles(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(parkingService.getMyVehicles(userDetails.getUsername()));
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
    public ResponseEntity<java.util.Map<String, String>> deleteVehicle(@PathVariable Long id) {
        parkingService.deactivateVehicle(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Vehicle deactivated"));
    }

    // ---- Parking Slots ----

    @GetMapping("/parking-slots")
    public ResponseEntity<List<ParkingSlotResponse>> getMyParkingSlots(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(parkingService.getMySlots(userDetails.getUsername()));
    }

    // ---- Documents ----

    @GetMapping("/documents")
    public ResponseEntity<List<DocumentResponse>> getDocuments(@RequestParam(required = false) String category) {
        if (category != null) return ResponseEntity.ok(documentService.getDocumentsByCategory(category));
        return ResponseEntity.ok(documentService.getAllDocuments());
    }

    // ---- Forum ----

    @GetMapping("/forum/topics")
    public ResponseEntity<List<ForumTopicResponse>> getForumTopics(@RequestParam(required = false) String category) {
        if (category != null) return ResponseEntity.ok(forumService.getTopicsByCategory(category));
        return ResponseEntity.ok(forumService.getAllTopics());
    }

    @PostMapping("/forum/topics")
    public ResponseEntity<ForumTopicResponse> createTopic(@Valid @RequestBody ForumTopicRequest request,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(forumService.createTopic(request, userDetails.getUsername()));
    }

    @GetMapping("/forum/topics/{id}/posts")
    public ResponseEntity<List<ForumPostResponse>> getTopicPosts(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.getTopicPosts(id));
    }

    @PostMapping("/forum/topics/{id}/reply")
    public ResponseEntity<ForumPostResponse> replyToTopic(@PathVariable Long id,
                                                           @Valid @RequestBody ForumPostRequest request,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(forumService.replyToTopic(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/forum/posts/{id}")
    public ResponseEntity<java.util.Map<String, String>> deleteOwnPost(@PathVariable Long id) {
        forumService.deletePost(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Post deleted"));
    }

    // ---- Events ----

    @GetMapping("/events")
    public ResponseEntity<List<EventResponse>> getEvents(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(eventService.getAllEvents(userDetails.getUsername()));
    }

    @PostMapping("/events/{id}/rsvp")
    public ResponseEntity<EventResponse> rsvpEvent(@PathVariable Long id,
                                                    @RequestBody RsvpRequest request,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(eventService.rsvp(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/events/{id}/rsvp")
    public ResponseEntity<java.util.Map<String, String>> cancelRsvp(@PathVariable Long id,
                                                                      @AuthenticationPrincipal UserDetails userDetails) {
        eventService.cancelRsvp(id, userDetails.getUsername());
        return ResponseEntity.ok(java.util.Map.of("message", "RSVP cancelled"));
    }

    // ---- Move Requests ----

    @GetMapping("/move-requests")
    public ResponseEntity<List<MoveRequestResponse>> getMyMoveRequests(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(moveService.getMyRequests(userDetails.getUsername()));
    }

    @PostMapping("/move-requests")
    public ResponseEntity<MoveRequestResponse> createMoveRequest(@RequestBody MoveRequestDto request,
                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(moveService.createRequest(request, userDetails.getUsername()));
    }
}
