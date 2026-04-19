package com.society.management.service;

import com.society.management.dto.FundReleaseRequest;
import com.society.management.dto.FundReleaseResponse;
import com.society.management.entity.*;
import com.society.management.repository.FundReleaseRepository;
import com.society.management.repository.PaymentRepository;
import com.society.management.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FundReleaseService {

    private final FundReleaseRepository fundReleaseRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final SocietyConfigService societyConfigService;
    private final NotificationService notificationService;
    private final TypeConfigService typeConfigService;

    public FundReleaseService(FundReleaseRepository fundReleaseRepository,
                              PaymentRepository paymentRepository,
                              UserRepository userRepository,
                              SocietyConfigService societyConfigService,
                              NotificationService notificationService,
                              TypeConfigService typeConfigService) {
        this.fundReleaseRepository = fundReleaseRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.societyConfigService = societyConfigService;
        this.notificationService = notificationService;
        this.typeConfigService = typeConfigService;
    }

    public FundReleaseResponse createReleaseRequest(FundReleaseRequest request, String username) {
        String fundType = request.getFundType();
        IncomeType incomeType = typeConfigService.getIncomeTypeByCode(fundType);
        if (!incomeType.isReserveFund()) {
            throw new RuntimeException("Only reserve fund types can be released. " + fundType + " is not a reserve fund type.");
        }

        BigDecimal available = getLockedBalance(fundType);
        if (request.getAmount().compareTo(available) > 0) {
            throw new RuntimeException("Requested amount (" + request.getAmount()
                    + ") exceeds available locked balance (" + available + ") for " + fundType);
        }

        FundRelease release = FundRelease.builder()
                .fundType(fundType)
                .amount(request.getAmount())
                .reason(request.getReason())
                .notes(request.getNotes())
                .status(FundReleaseStatus.PENDING)
                .requestedBy(username)
                .build();

        release = fundReleaseRepository.save(release);

        notificationService.createNotificationForAdmins(
                "Fund Release Request",
                username + " requested release of Rs. " + request.getAmount() + " from " + fundType + " fund",
                NotificationType.FUND_RELEASE,
                release.getId()
        );

        return FundReleaseResponse.from(release);
    }

    public FundReleaseResponse approveRelease(Long id, String username) {
        FundRelease release = fundReleaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fund release request not found"));
        if (release.getStatus() != FundReleaseStatus.PENDING) {
            throw new RuntimeException("Only PENDING requests can be approved");
        }

        User approver = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        var config = societyConfigService.getOrCreate();
        String approvalRolesStr = config.getExpenseApprovalRoles();
        if (approvalRolesStr != null && !approvalRolesStr.isBlank()) {
            List<String> approvalRoles = Arrays.asList(approvalRolesStr.split(","));
            List<String> userRoles = approver.getRoleList();
            boolean hasApprovalRole = userRoles.contains("ADMIN") || userRoles.stream().anyMatch(approvalRoles::contains);
            if (!hasApprovalRole) {
                throw new RuntimeException("You do not have permission to approve fund releases. Required roles: " + approvalRolesStr);
            }
        }

        BigDecimal available = getLockedBalance(release.getFundType());
        if (release.getAmount().compareTo(available) > 0) {
            throw new RuntimeException("Insufficient locked balance for " + release.getFundType()
                    + ". Available: " + available);
        }

        release.setStatus(FundReleaseStatus.APPROVED);
        release.setApprovedBy(username);
        release.setApprovedAt(LocalDateTime.now());
        release = fundReleaseRepository.save(release);

        User requester = userRepository.findByUsername(release.getRequestedBy()).orElse(null);
        if (requester != null) {
            notificationService.createNotification(
                    requester,
                    "Fund Release Approved",
                    "Your request to release Rs. " + release.getAmount() + " from " + release.getFundType() + " fund has been approved by " + username,
                    NotificationType.FUND_RELEASE,
                    release.getId()
            );
        }

        return FundReleaseResponse.from(release);
    }

    public FundReleaseResponse rejectRelease(Long id, String rejectionReason, String username) {
        FundRelease release = fundReleaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fund release request not found"));
        if (release.getStatus() != FundReleaseStatus.PENDING) {
            throw new RuntimeException("Only PENDING requests can be rejected");
        }

        release.setStatus(FundReleaseStatus.REJECTED);
        release.setRejectionReason(rejectionReason);
        release.setApprovedBy(username);
        release.setApprovedAt(LocalDateTime.now());
        release = fundReleaseRepository.save(release);

        User requester = userRepository.findByUsername(release.getRequestedBy()).orElse(null);
        if (requester != null) {
            notificationService.createNotification(
                    requester,
                    "Fund Release Rejected",
                    "Your request to release Rs. " + release.getAmount() + " from " + release.getFundType()
                            + " fund has been rejected. Reason: " + rejectionReason,
                    NotificationType.FUND_RELEASE,
                    release.getId()
            );
        }

        return FundReleaseResponse.from(release);
    }

    public FundReleaseResponse markAsReleased(Long id, String username) {
        FundRelease release = fundReleaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fund release request not found"));
        if (release.getStatus() != FundReleaseStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED requests can be marked as released");
        }

        release.setStatus(FundReleaseStatus.RELEASED);
        return FundReleaseResponse.from(fundReleaseRepository.save(release));
    }

    public List<FundReleaseResponse> getAllReleases() {
        return fundReleaseRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(FundReleaseResponse::from).collect(Collectors.toList());
    }

    public List<FundReleaseResponse> getReleasesByStatus(String status) {
        return fundReleaseRepository.findByStatusOrderByCreatedAtDesc(FundReleaseStatus.valueOf(status))
                .stream().map(FundReleaseResponse::from).collect(Collectors.toList());
    }

    public BigDecimal getLockedBalance(String fundType) {
        BigDecimal totalCollected = paymentRepository.findByPaymentTypeOrderByCreatedAtDesc(fundType).stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<FundReleaseStatus> activeStatuses = List.of(
                FundReleaseStatus.PENDING, FundReleaseStatus.APPROVED, FundReleaseStatus.RELEASED);
        BigDecimal totalReleased = fundReleaseRepository.findByStatusIn(activeStatuses).stream()
                .filter(fr -> fundType.equals(fr.getFundType()))
                .map(FundRelease::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return totalCollected.subtract(totalReleased).max(BigDecimal.ZERO);
    }
}
