package com.society.management.service;

import com.society.management.dto.*;
import com.society.management.entity.*;
import com.society.management.repository.*;
import org.springframework.stereotype.Service;

import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class VisitorService {

    private final VisitorRepository visitorRepository;
    private final VisitLogRepository visitLogRepository;
    private final DailyHelpRepository dailyHelpRepository;
    private final DeliveryLogRepository deliveryLogRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final Random random = new Random();

    public VisitorService(VisitorRepository visitorRepository, VisitLogRepository visitLogRepository,
                          DailyHelpRepository dailyHelpRepository, DeliveryLogRepository deliveryLogRepository,
                          UserRepository userRepository, PropertyRepository propertyRepository,
                          NotificationService notificationService, EmailService emailService) {
        this.visitorRepository = visitorRepository;
        this.visitLogRepository = visitLogRepository;
        this.dailyHelpRepository = dailyHelpRepository;
        this.deliveryLogRepository = deliveryLogRepository;
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    // ==================== Pre-Approval ====================

    public PreApproveResponse preApproveVisitor(PreApproveRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Property property = null;
        if (user.getUnitNumber() != null) {
            property = propertyRepository.findByUnitNumber(user.getUnitNumber()).orElse(null);
        }

        // Find or create visitor
        Visitor visitor = visitorRepository.findByPhone(request.getVisitorPhone())
                .orElseGet(() -> visitorRepository.save(Visitor.builder()
                        .name(request.getVisitorName())
                        .phone(request.getVisitorPhone())
                        .email(request.getVisitorEmail())
                        .visitorType(request.getVisitorType() != null
                                ? VisitorType.valueOf(request.getVisitorType()) : VisitorType.GUEST)
                        .vehicleNumber(request.getVehicleNumber())
                        .build()));

        // Update visitor details if changed
        boolean visitorUpdated = false;
        if (!visitor.getName().equals(request.getVisitorName())) {
            visitor.setName(request.getVisitorName());
            visitorUpdated = true;
        }
        if (request.getVisitorEmail() != null && !request.getVisitorEmail().equals(visitor.getEmail())) {
            visitor.setEmail(request.getVisitorEmail());
            visitorUpdated = true;
        }
        if (visitorUpdated) {
            visitorRepository.save(visitor);
        }

        LocalDateTime validUntil = request.getValidUntil();
        // Backward compatibility: if only expectedAt was provided, derive validUntil
        if (validUntil == null && request.getExpectedAt() != null) {
            validUntil = request.getExpectedAt().plusHours(4);
        }

        VisitLog visitLog = VisitLog.builder()
                .visitor(visitor)
                .user(user)
                .property(property)
                .purpose(request.getPurpose())
                .passcode(generatePasscode())
                .status(VisitStatus.EXPECTED)
                .expectedAt(request.getExpectedAt())
                .validUntil(validUntil)
                .build();

        PreApproveResponse response = PreApproveResponse.from(visitLogRepository.save(visitLog));

        // Send passcode email to visitor if email provided
        if (visitor.getEmail() != null && !visitor.getEmail().isBlank()) {
            emailService.sendVisitorPasscodeEmail(visitor.getEmail(), visitor.getName(),
                    response.getPasscode(), validUntil, user.getFullName(),
                    property != null ? property.getUnitNumber() : user.getUnitNumber());
        }

        return response;
    }

    public List<PreApproveResponse> getMyApprovals(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return visitLogRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(vl -> vl.getStatus() == VisitStatus.EXPECTED)
                .map(PreApproveResponse::from)
                .collect(Collectors.toList());
    }

    public List<VisitLogResponse> getVisitHistory(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return visitLogRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(VisitLogResponse::from)
                .collect(Collectors.toList());
    }

    public void cancelApproval(Long visitLogId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        VisitLog vl = visitLogRepository.findById(visitLogId)
                .orElseThrow(() -> new RuntimeException("Visit log not found"));
        if (!vl.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to cancel this approval");
        }
        if (vl.getStatus() != VisitStatus.EXPECTED) {
            throw new RuntimeException("Can only cancel expected visits");
        }
        vl.setStatus(VisitStatus.EXPIRED);
        visitLogRepository.save(vl);
    }

    // ==================== Guard Operations ====================

    public VisitLogResponse verifyPasscode(String passcode) {
        expireStaleVisits();
        VisitLog vl = visitLogRepository.findByPasscodeAndStatus(passcode, VisitStatus.EXPECTED)
                .orElseThrow(() -> new RuntimeException("Invalid or expired passcode"));
        if (vl.getValidUntil() != null && vl.getValidUntil().isBefore(LocalDateTime.now())) {
            vl.setStatus(VisitStatus.EXPIRED);
            visitLogRepository.save(vl);
            throw new RuntimeException("Passcode has expired");
        }
        return VisitLogResponse.from(vl);
    }

    // Guard requests resident approval for a walk-in visitor (MyGate-style)
    public VisitLogResponse requestApproval(CheckInRequest request, String guardUsername) {
        User guard = userRepository.findByUsername(guardUsername)
                .orElseThrow(() -> new RuntimeException("Guard not found"));

        if (request.getVisitorName() == null || request.getUnitNumber() == null) {
            throw new RuntimeException("Visitor name and unit number are required");
        }

        Property property = propertyRepository.findByUnitNumber(request.getUnitNumber())
                .orElseThrow(() -> new RuntimeException("Property not found: " + request.getUnitNumber()));

        User resident = userRepository.findFirstByUnitNumber(request.getUnitNumber())
                .orElseThrow(() -> new RuntimeException("No resident found for property: " + request.getUnitNumber()));

        Visitor visitor = visitorRepository.findByPhone(request.getVisitorPhone() != null ? request.getVisitorPhone() : "")
                .orElseGet(() -> visitorRepository.save(Visitor.builder()
                        .name(request.getVisitorName())
                        .phone(request.getVisitorPhone())
                        .visitorType(request.getVisitorType() != null
                                ? VisitorType.valueOf(request.getVisitorType()) : VisitorType.GUEST)
                        .vehicleNumber(request.getVehicleNumber())
                        .build()));

        VisitLog visitLog = VisitLog.builder()
                .visitor(visitor)
                .user(resident)
                .property(property)
                .purpose(request.getPurpose())
                .status(VisitStatus.AWAITING_APPROVAL)
                .checkedInBy(guard)
                .guardNotes(request.getGuardNotes())
                .expectedAt(LocalDateTime.now())
                .validUntil(LocalDateTime.now().plusHours(1))
                .build();

        VisitLog saved = visitLogRepository.save(visitLog);

        notificationService.createNotification(
                resident,
                "Visitor at Gate",
                visitor.getName() + " is at the gate requesting entry",
                NotificationType.VISITOR_ARRIVAL,
                saved.getId()
        );

        return VisitLogResponse.from(saved);
    }

    // Resident approves a walk-in visitor at the gate
    public VisitLogResponse approveVisit(Long visitLogId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        VisitLog vl = visitLogRepository.findById(visitLogId)
                .orElseThrow(() -> new RuntimeException("Visit log not found"));
        if (!vl.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to approve this visit");
        }
        if (vl.getStatus() != VisitStatus.AWAITING_APPROVAL) {
            throw new RuntimeException("This visit is not awaiting approval");
        }
        vl.setStatus(VisitStatus.EXPECTED);
        vl.setPasscode(generatePasscode());
        vl.setValidUntil(LocalDateTime.now().plusHours(4));
        VisitLog savedApproved = visitLogRepository.save(vl);

        // Notify guard who requested the approval
        if (vl.getCheckedInBy() != null) {
            notificationService.createNotification(
                    vl.getCheckedInBy(),
                    "Visit Approved",
                    user.getFullName() + " approved entry for " + vl.getVisitor().getName(),
                    NotificationType.VISITOR_ARRIVAL,
                    savedApproved.getId()
            );
        }

        return VisitLogResponse.from(savedApproved);
    }

    // Resident rejects a walk-in visitor at the gate
    public VisitLogResponse rejectVisit(Long visitLogId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        VisitLog vl = visitLogRepository.findById(visitLogId)
                .orElseThrow(() -> new RuntimeException("Visit log not found"));
        if (!vl.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to reject this visit");
        }
        if (vl.getStatus() != VisitStatus.AWAITING_APPROVAL) {
            throw new RuntimeException("This visit is not awaiting approval");
        }
        vl.setStatus(VisitStatus.REJECTED);
        VisitLog savedRejected = visitLogRepository.save(vl);

        // Notify guard who requested the approval
        if (vl.getCheckedInBy() != null) {
            notificationService.createNotification(
                    vl.getCheckedInBy(),
                    "Visit Denied",
                    user.getFullName() + " denied entry for " + vl.getVisitor().getName(),
                    NotificationType.VISITOR_ARRIVAL,
                    savedRejected.getId()
            );
        }

        return VisitLogResponse.from(savedRejected);
    }

    // Get pending approval requests for a resident
    public List<VisitLogResponse> getPendingApprovals(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return visitLogRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), VisitStatus.AWAITING_APPROVAL).stream()
                .map(VisitLogResponse::from)
                .collect(Collectors.toList());
    }

    // Get all visits awaiting resident approval (for guard dashboard)
    public List<VisitLogResponse> getAwaitingApproval() {
        return visitLogRepository.findByStatus(VisitStatus.AWAITING_APPROVAL).stream()
                .map(VisitLogResponse::from)
                .collect(Collectors.toList());
    }

    public VisitLogResponse checkIn(CheckInRequest request, String guardUsername) {
        User guard = userRepository.findByUsername(guardUsername)
                .orElseThrow(() -> new RuntimeException("Guard not found"));

        VisitLog visitLog;

        if (request.getPasscode() != null && !request.getPasscode().isBlank()) {
            // Pre-approved check-in via passcode
            visitLog = visitLogRepository.findByPasscodeAndStatus(request.getPasscode(), VisitStatus.EXPECTED)
                    .orElseThrow(() -> new RuntimeException("Invalid or expired passcode"));
        } else if (request.getVisitLogId() != null) {
            // Check in an approved visit (after resident approval)
            visitLog = visitLogRepository.findById(request.getVisitLogId())
                    .orElseThrow(() -> new RuntimeException("Visit log not found"));
            if (visitLog.getStatus() != VisitStatus.EXPECTED) {
                throw new RuntimeException("This visit is not yet approved by the resident");
            }
        } else {
            throw new RuntimeException("Passcode or approved visit ID is required for check-in");
        }

        visitLog.setStatus(VisitStatus.CHECKED_IN);
        visitLog.setCheckInTime(LocalDateTime.now());
        visitLog.setCheckedInBy(guard);
        if (request.getGuardNotes() != null) {
            visitLog.setGuardNotes(request.getGuardNotes());
        }

        return VisitLogResponse.from(visitLogRepository.save(visitLog));
    }

    public VisitLogResponse checkOut(CheckOutRequest request, String guardUsername) {
        User guard = userRepository.findByUsername(guardUsername)
                .orElseThrow(() -> new RuntimeException("Guard not found"));

        VisitLog vl = visitLogRepository.findById(request.getVisitLogId())
                .orElseThrow(() -> new RuntimeException("Visit log not found"));

        if (vl.getStatus() != VisitStatus.CHECKED_IN) {
            throw new RuntimeException("Visitor is not currently checked in");
        }

        vl.setStatus(VisitStatus.CHECKED_OUT);
        vl.setCheckOutTime(LocalDateTime.now());
        vl.setCheckedOutBy(guard);
        if (request.getGuardNotes() != null) {
            vl.setGuardNotes(request.getGuardNotes());
        }

        return VisitLogResponse.from(visitLogRepository.save(vl));
    }

    public VisitLogResponse denyEntry(Long visitLogId, String guardNotes, String guardUsername) {
        User guard = userRepository.findByUsername(guardUsername)
                .orElseThrow(() -> new RuntimeException("Guard not found"));

        VisitLog vl = visitLogRepository.findById(visitLogId)
                .orElseThrow(() -> new RuntimeException("Visit log not found"));

        vl.setStatus(VisitStatus.DENIED);
        vl.setGuardNotes(guardNotes);
        vl.setCheckedInBy(guard);

        return VisitLogResponse.from(visitLogRepository.save(vl));
    }

    public List<VisitLogResponse> getExpectedVisitors() {
        expireStaleVisits();
        return visitLogRepository.findByStatus(VisitStatus.EXPECTED).stream()
                .map(VisitLogResponse::from)
                .collect(Collectors.toList());
    }

    public List<VisitLogResponse> getCurrentlyInside() {
        return visitLogRepository.findByStatus(VisitStatus.CHECKED_IN).stream()
                .map(VisitLogResponse::from)
                .collect(Collectors.toList());
    }

    public List<VisitLogResponse> getAllVisitLogs() {
        return visitLogRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(VisitLogResponse::from)
                .collect(Collectors.toList());
    }

    // ==================== Daily Help ====================

    // Resident adds their own daily help — directly APPROVED
    public DailyHelpResponse addDailyHelp(DailyHelpRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Your account was not found. Please log in again."));

        Property property = null;
        if (user.getUnitNumber() != null) {
            property = propertyRepository.findByUnitNumber(user.getUnitNumber()).orElse(null);
        }

        DailyHelp dh = DailyHelp.builder()
                .user(user)
                .property(property)
                .name(request.getName())
                .phone(request.getPhone())
                .category(DailyHelpCategory.valueOf(request.getCategory()))
                .workingDays(request.getWorkingDays())
                .timeSlot(request.getTimeSlot())
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .status(DailyHelpStatus.APPROVED)
                .addedBy(user)
                .approvedBy(user)
                .approvedAt(LocalDateTime.now())
                .build();

        return DailyHelpResponse.from(dailyHelpRepository.save(dh));
    }

    // Guard adds daily help for a specific villa — PENDING_APPROVAL from villa owner
    public DailyHelpResponse addDailyHelpForProperty(DailyHelpRequest request, String guardUsername) {
        User guard = userRepository.findByUsername(guardUsername)
                .orElseThrow(() -> new RuntimeException("Your account was not found. Please log in again."));

        if (request.getUnitNumber() == null || request.getUnitNumber().isBlank()) {
            throw new RuntimeException("Please select a property for this staff.");
        }

        Property property = propertyRepository.findByUnitNumber(request.getUnitNumber())
                .orElseThrow(() -> new RuntimeException("Property " + request.getUnitNumber() + " was not found. Please select a valid property."));

        User resident = userRepository.findFirstByUnitNumber(request.getUnitNumber())
                .orElseThrow(() -> new RuntimeException("No resident is registered for property " + request.getUnitNumber() + ". Staff cannot be added without an owner."));

        DailyHelp dh = DailyHelp.builder()
                .user(resident)
                .property(property)
                .name(request.getName())
                .phone(request.getPhone())
                .category(DailyHelpCategory.valueOf(request.getCategory()))
                .workingDays(request.getWorkingDays())
                .timeSlot(request.getTimeSlot())
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .status(DailyHelpStatus.PENDING_APPROVAL)
                .addedBy(guard)
                .build();

        DailyHelp saved = dailyHelpRepository.save(dh);

        notificationService.createNotification(
                resident,
                "Staff Approval Request",
                guard.getFullName() + " has registered " + request.getName() + " (" + request.getCategory() + ") for your property. Please approve or reject.",
                NotificationType.GENERAL,
                saved.getId()
        );

        return DailyHelpResponse.from(saved);
    }

    // Secretary/President adds society-level staff (no property, directly APPROVED)
    public DailyHelpResponse addSocietyStaff(DailyHelpRequest request, String adminUsername) {
        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new RuntimeException("Your account was not found. Please log in again."));

        DailyHelp dh = DailyHelp.builder()
                .user(admin)
                .property(null)
                .name(request.getName())
                .phone(request.getPhone())
                .category(DailyHelpCategory.valueOf(request.getCategory()))
                .workingDays(request.getWorkingDays())
                .timeSlot(request.getTimeSlot())
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .status(DailyHelpStatus.APPROVED)
                .addedBy(admin)
                .approvedBy(admin)
                .approvedAt(LocalDateTime.now())
                .build();

        return DailyHelpResponse.from(dailyHelpRepository.save(dh));
    }

    // Resident approves daily help added by guard
    public DailyHelpResponse approveDailyHelp(Long id, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Your account was not found. Please log in again."));
        DailyHelp dh = dailyHelpRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("This staff record was not found. It may have been removed."));
        if (!dh.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only approve staff registered for your own property.");
        }
        if (dh.getStatus() != DailyHelpStatus.PENDING_APPROVAL) {
            throw new RuntimeException("This staff has already been " + dh.getStatus().name().toLowerCase().replace('_', ' ') + ".");
        }
        dh.setStatus(DailyHelpStatus.APPROVED);
        dh.setApprovedBy(user);
        dh.setApprovedAt(LocalDateTime.now());
        return DailyHelpResponse.from(dailyHelpRepository.save(dh));
    }

    // Resident rejects daily help added by guard
    public DailyHelpResponse rejectDailyHelp(Long id, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Your account was not found. Please log in again."));
        DailyHelp dh = dailyHelpRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("This staff record was not found. It may have been removed."));
        if (!dh.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only reject staff registered for your own property.");
        }
        if (dh.getStatus() != DailyHelpStatus.PENDING_APPROVAL) {
            throw new RuntimeException("This staff has already been " + dh.getStatus().name().toLowerCase().replace('_', ' ') + ".");
        }
        dh.setStatus(DailyHelpStatus.REJECTED);
        dh.setActive(false);
        return DailyHelpResponse.from(dailyHelpRepository.save(dh));
    }

    // Resident gets their daily help (all statuses)
    public List<DailyHelpResponse> getMyDailyHelp(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return dailyHelpRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .map(DailyHelpResponse::from)
                .collect(Collectors.toList());
    }

    // Guard/Admin gets only APPROVED active daily help (for check-in)
    public List<DailyHelpResponse> getAllApprovedDailyHelp() {
        return dailyHelpRepository.findAllByActiveTrueAndStatus(DailyHelpStatus.APPROVED).stream()
                .map(DailyHelpResponse::from)
                .collect(Collectors.toList());
    }

    // Admin gets all active daily help (all statuses)
    public List<DailyHelpResponse> getAllActiveDailyHelp() {
        return dailyHelpRepository.findAllByActiveTrue().stream()
                .map(DailyHelpResponse::from)
                .collect(Collectors.toList());
    }

    // Get society-level staff only (no property assigned)
    public List<DailyHelpResponse> getSocietyStaff() {
        return dailyHelpRepository.findAllByPropertyIsNullAndActiveTrue().stream()
                .map(DailyHelpResponse::from)
                .collect(Collectors.toList());
    }

    public void deactivateDailyHelp(Long id, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Your account was not found. Please log in again."));
        DailyHelp dh = dailyHelpRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("This staff record was not found. It may have been removed."));
        if (!dh.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only deactivate staff registered for your own property.");
        }
        dh.setActive(false);
        dh.setEndDate(LocalDate.now());
        dailyHelpRepository.save(dh);
    }

    // Photo upload for daily help
    public DailyHelpResponse uploadDailyHelpPhoto(Long id, MultipartFile file) {
        DailyHelp dh = dailyHelpRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff record not found. Cannot upload photo."));
        try {
            java.nio.file.Path uploadPath = java.nio.file.Paths.get("./uploads", "daily-help");
            java.nio.file.Files.createDirectories(uploadPath);

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = "dh_" + id + "_" + java.util.UUID.randomUUID().toString().substring(0, 8) + extension;

            java.nio.file.Path filePath = uploadPath.resolve(filename);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            dh.setPhoto("/api/uploads/daily-help/" + filename);
            return DailyHelpResponse.from(dailyHelpRepository.save(dh));
        } catch (java.io.IOException e) {
            throw new RuntimeException("Photo upload failed. Please try a smaller image or a different format (JPG, PNG).");
        }
    }

    public java.nio.file.Path getDailyHelpPhotoPath(String filename) {
        return java.nio.file.Paths.get("./uploads", "daily-help", filename);
    }

    public VisitLogResponse checkInDailyHelp(Long dailyHelpId, String guardUsername) {
        User guard = userRepository.findByUsername(guardUsername)
                .orElseThrow(() -> new RuntimeException("Your account was not found. Please log in again."));

        DailyHelp dh = dailyHelpRepository.findById(dailyHelpId)
                .orElseThrow(() -> new RuntimeException("Staff record not found. It may have been removed."));

        if (!dh.isActive()) {
            throw new RuntimeException(dh.getName() + " has been deactivated by the property owner and cannot enter.");
        }

        if (dh.getStatus() != DailyHelpStatus.APPROVED) {
            throw new RuntimeException(dh.getName() + " is still waiting for approval from the property owner.");
        }

        Visitor visitor = visitorRepository.findByPhone(dh.getPhone() != null ? dh.getPhone() : "")
                .orElseGet(() -> visitorRepository.save(Visitor.builder()
                        .name(dh.getName())
                        .phone(dh.getPhone())
                        .visitorType(VisitorType.DAILY_HELP)
                        .build()));

        VisitLog visitLog = VisitLog.builder()
                .visitor(visitor)
                .user(dh.getUser())
                .property(dh.getProperty())
                .purpose("Daily Help - " + dh.getCategory().name())
                .status(VisitStatus.CHECKED_IN)
                .checkInTime(LocalDateTime.now())
                .checkedInBy(guard)
                .build();

        return VisitLogResponse.from(visitLogRepository.save(visitLog));
    }

    // ==================== Deliveries ====================

    public DeliveryLogResponse logDelivery(DeliveryLogRequest request, String guardUsername) {
        Property property = propertyRepository.findByUnitNumber(request.getUnitNumber())
                .orElseThrow(() -> new RuntimeException("Property not found: " + request.getUnitNumber()));

        User resident = userRepository.findFirstByUnitNumber(request.getUnitNumber())
                .orElseThrow(() -> new RuntimeException("No resident found for property: " + request.getUnitNumber()));

        DeliveryLog dl = DeliveryLog.builder()
                .user(resident)
                .property(property)
                .deliveryService(request.getDeliveryService())
                .description(request.getDescription())
                .build();

        return DeliveryLogResponse.from(deliveryLogRepository.save(dl));
    }

    public List<DeliveryLogResponse> getPendingDeliveries() {
        return deliveryLogRepository.findByStatus(DeliveryStatus.PENDING).stream()
                .map(DeliveryLogResponse::from)
                .collect(Collectors.toList());
    }

    public DeliveryLogResponse markDeliveryPickedUp(Long id, String receivedBy) {
        DeliveryLog dl = deliveryLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));
        dl.setStatus(DeliveryStatus.PICKED_UP);
        dl.setReceivedBy(receivedBy);
        dl.setReceivedAt(LocalDateTime.now());
        return DeliveryLogResponse.from(deliveryLogRepository.save(dl));
    }

    public List<DeliveryLogResponse> getMyDeliveries(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return deliveryLogRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(DeliveryLogResponse::from)
                .collect(Collectors.toList());
    }

    // ==================== Stats ====================

    public VisitorStatsResponse getTodayStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        VisitorStatsResponse stats = new VisitorStatsResponse();
        stats.setTodayCheckIns(visitLogRepository.countByStatusAndCreatedAtBetween(VisitStatus.CHECKED_IN, startOfDay, endOfDay)
                + visitLogRepository.countByStatusAndCreatedAtBetween(VisitStatus.CHECKED_OUT, startOfDay, endOfDay));
        stats.setTodayCheckOuts(visitLogRepository.countByStatusAndCreatedAtBetween(VisitStatus.CHECKED_OUT, startOfDay, endOfDay));
        stats.setCurrentlyInside(visitLogRepository.findByStatus(VisitStatus.CHECKED_IN).size());
        stats.setExpectedToday(visitLogRepository.findByStatus(VisitStatus.EXPECTED).size());
        stats.setPendingDeliveries(deliveryLogRepository.findByStatus(DeliveryStatus.PENDING).size());
        stats.setAwaitingApproval(visitLogRepository.findByStatus(VisitStatus.AWAITING_APPROVAL).size());
        return stats;
    }

    // ==================== Analytics ====================

    public VisitorAnalyticsResponse getVisitorAnalytics(LocalDate from, LocalDate to) {
        List<VisitLog> visits = visitLogRepository.findAll().stream()
                .filter(vl -> {
                    LocalDate date = vl.getCreatedAt().toLocalDate();
                    return !date.isBefore(from) && !date.isAfter(to);
                })
                .collect(Collectors.toList());

        VisitorAnalyticsResponse response = new VisitorAnalyticsResponse();

        // Daily trend
        java.util.Map<LocalDate, Long> dailyMap = visits.stream()
                .collect(Collectors.groupingBy(vl -> vl.getCreatedAt().toLocalDate(), Collectors.counting()));
        response.setDailyTrend(from.datesUntil(to.plusDays(1))
                .map(d -> new VisitorAnalyticsResponse.DailyCount(d.toString(), dailyMap.getOrDefault(d, 0L)))
                .collect(Collectors.toList()));

        // Type distribution
        response.setTypeDistribution(visits.stream()
                .filter(vl -> vl.getVisitor() != null && vl.getVisitor().getVisitorType() != null)
                .collect(Collectors.groupingBy(vl -> vl.getVisitor().getVisitorType().name(), Collectors.counting())));

        // Peak hours
        response.setPeakHours(visits.stream()
                .collect(Collectors.groupingBy(vl -> vl.getCreatedAt().getHour(), Collectors.counting())));

        // Frequent visitors (top 10)
        java.util.Map<String, List<VisitLog>> byVisitor = visits.stream()
                .filter(vl -> vl.getVisitor() != null)
                .collect(Collectors.groupingBy(vl -> vl.getVisitor().getPhone() != null ? vl.getVisitor().getPhone() : vl.getVisitor().getName()));
        response.setFrequentVisitors(byVisitor.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue().size(), a.getValue().size()))
                .limit(10)
                .map(e -> {
                    VisitLog sample = e.getValue().get(0);
                    return new VisitorAnalyticsResponse.FrequentVisitor(
                            sample.getVisitor().getName(),
                            sample.getVisitor().getPhone(),
                            e.getValue().size());
                })
                .collect(Collectors.toList()));

        // Unit-wise count (top 10)
        java.util.Map<String, Long> unitMap = visits.stream()
                .filter(vl -> vl.getProperty() != null)
                .collect(Collectors.groupingBy(vl -> vl.getProperty().getUnitNumber(), Collectors.counting()));
        response.setUnitWiseCount(unitMap.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(e -> new VisitorAnalyticsResponse.UnitCount(e.getKey(), e.getValue()))
                .collect(Collectors.toList()));

        return response;
    }

    // ==================== Helpers ====================

    private String generatePasscode() {
        for (int i = 0; i < 10; i++) {
            String code = String.format("%06d", random.nextInt(1000000));
            if (visitLogRepository.findByPasscodeAndStatus(code, VisitStatus.EXPECTED).isEmpty()) {
                return code;
            }
        }
        throw new RuntimeException("Failed to generate unique passcode");
    }

    private void expireStaleVisits() {
        List<VisitLog> stale = visitLogRepository.findByStatusAndValidUntilBefore(
                VisitStatus.EXPECTED, LocalDateTime.now());
        for (VisitLog vl : stale) {
            vl.setStatus(VisitStatus.EXPIRED);
        }
        if (!stale.isEmpty()) {
            visitLogRepository.saveAll(stale);
        }
    }
}
