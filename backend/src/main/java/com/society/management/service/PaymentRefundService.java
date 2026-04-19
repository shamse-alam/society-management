package com.society.management.service;

import com.society.management.dto.PaymentRefundRequest;
import com.society.management.dto.PaymentRefundResponse;
import com.society.management.entity.*;
import com.society.management.repository.PaymentRefundRepository;
import com.society.management.repository.PaymentRepository;
import com.society.management.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PaymentRefundService {

    private final PaymentRefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final SocietyConfigService societyConfigService;
    private final NotificationService notificationService;

    public PaymentRefundService(PaymentRefundRepository refundRepository,
                                PaymentRepository paymentRepository,
                                UserRepository userRepository,
                                SocietyConfigService societyConfigService,
                                NotificationService notificationService) {
        this.refundRepository = refundRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.societyConfigService = societyConfigService;
        this.notificationService = notificationService;
    }

    private String generateRefundNumber() {
        String prefix = "RFD-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        Optional<PaymentRefund> latest = refundRepository.findTopByRefundNumberStartingWithOrderByRefundNumberDesc(prefix);
        int nextSeq = 1;
        if (latest.isPresent()) {
            String lastNum = latest.get().getRefundNumber().substring(prefix.length());
            nextSeq = Integer.parseInt(lastNum) + 1;
        }
        return prefix + String.format("%04d", nextSeq);
    }

    private void validateApprovalRole(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        var config = societyConfigService.getOrCreate();
        String approvalRolesStr = config.getExpenseApprovalRoles();
        if (approvalRolesStr != null && !approvalRolesStr.isBlank()) {
            List<String> approvalRoles = Arrays.asList(approvalRolesStr.split(","));
            List<String> userRoles = user.getRoleList();
            boolean hasRole = userRoles.contains("ADMIN") || userRoles.stream().anyMatch(approvalRoles::contains);
            if (!hasRole) {
                throw new RuntimeException("You do not have permission to manage refunds. Required roles: " + approvalRolesStr);
            }
        }
    }

    @Transactional
    public PaymentRefundResponse createRefundRequest(PaymentRefundRequest request, String username) {
        validateApprovalRole(username);

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new RuntimeException("Only PAID payments can be refunded");
        }

        // Check no existing non-REJECTED refund on this payment
        Optional<PaymentRefund> existing = refundRepository.findByPaymentIdAndStatusNot(
                payment.getId(), PaymentRefundStatus.REJECTED);
        if (existing.isPresent()) {
            throw new RuntimeException("A refund request already exists for this payment (status: "
                    + existing.get().getStatus() + ")");
        }

        if (request.getAmount().compareTo(payment.getAmount()) > 0) {
            throw new RuntimeException("Refund amount (" + request.getAmount()
                    + ") cannot exceed original payment amount (" + payment.getAmount() + ")");
        }

        PaymentRefund refund = PaymentRefund.builder()
                .payment(payment)
                .user(payment.getUser())
                .amount(request.getAmount())
                .reason(request.getReason())
                .notes(request.getNotes())
                .status(PaymentRefundStatus.PENDING)
                .refundNumber(generateRefundNumber())
                .requestedBy(username)
                .build();

        refund = refundRepository.save(refund);

        notificationService.createNotificationForAdmins(
                "Refund Request Raised",
                username + " raised a refund of Rs. " + request.getAmount()
                        + " for " + payment.getPaymentType() + " payment (Receipt: " + payment.getReceiptNumber() + ")",
                NotificationType.PAYMENT_REFUND,
                refund.getId()
        );

        return PaymentRefundResponse.from(refund);
    }

    @Transactional
    public PaymentRefundResponse approveRefund(Long id, String username) {
        validateApprovalRole(username);

        PaymentRefund refund = refundRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Refund request not found"));

        if (refund.getStatus() != PaymentRefundStatus.PENDING) {
            throw new RuntimeException("Only PENDING refund requests can be approved");
        }

        // Maker-checker: approver must differ from requester
        if (username.equals(refund.getRequestedBy())) {
            throw new RuntimeException("You cannot approve your own refund request");
        }

        refund.setStatus(PaymentRefundStatus.APPROVED);
        refund.setApprovedBy(username);
        refund.setApprovedAt(LocalDateTime.now());
        refund = refundRepository.save(refund);

        User requester = userRepository.findByUsername(refund.getRequestedBy()).orElse(null);
        if (requester != null) {
            notificationService.createNotification(
                    requester,
                    "Refund Approved",
                    "Your refund request " + refund.getRefundNumber() + " for Rs. " + refund.getAmount()
                            + " has been approved by " + username,
                    NotificationType.PAYMENT_REFUND,
                    refund.getId()
            );
        }

        return PaymentRefundResponse.from(refund);
    }

    @Transactional
    public PaymentRefundResponse rejectRefund(Long id, String rejectionReason, String username) {
        PaymentRefund refund = refundRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Refund request not found"));

        if (refund.getStatus() != PaymentRefundStatus.PENDING) {
            throw new RuntimeException("Only PENDING refund requests can be rejected");
        }

        refund.setStatus(PaymentRefundStatus.REJECTED);
        refund.setRejectionReason(rejectionReason);
        refund.setApprovedBy(username);
        refund.setApprovedAt(LocalDateTime.now());
        refund = refundRepository.save(refund);

        User requester = userRepository.findByUsername(refund.getRequestedBy()).orElse(null);
        if (requester != null) {
            notificationService.createNotification(
                    requester,
                    "Refund Rejected",
                    "Your refund request " + refund.getRefundNumber() + " for Rs. " + refund.getAmount()
                            + " has been rejected. Reason: " + rejectionReason,
                    NotificationType.PAYMENT_REFUND,
                    refund.getId()
            );
        }

        return PaymentRefundResponse.from(refund);
    }

    @Transactional
    public PaymentRefundResponse processRefund(Long id, String username) {
        PaymentRefund refund = refundRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Refund request not found"));

        if (refund.getStatus() != PaymentRefundStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED refund requests can be processed");
        }

        refund.setStatus(PaymentRefundStatus.PROCESSED);
        refund.setProcessedAt(LocalDateTime.now());
        refund = refundRepository.save(refund);

        // Mark original payment as REFUNDED
        Payment payment = refund.getPayment();
        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);

        // Notify the resident
        notificationService.createNotification(
                refund.getUser(),
                "Refund Processed",
                "A refund of Rs. " + refund.getAmount() + " for your " + payment.getPaymentType()
                        + " payment has been processed. Refund voucher: " + refund.getRefundNumber(),
                NotificationType.PAYMENT_REFUND,
                refund.getId()
        );

        return PaymentRefundResponse.from(refund);
    }

    public List<PaymentRefundResponse> getAllRefunds() {
        return refundRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(PaymentRefundResponse::from).collect(Collectors.toList());
    }

    public List<PaymentRefundResponse> getRefundsByStatus(String status) {
        return refundRepository.findByStatusOrderByCreatedAtDesc(PaymentRefundStatus.valueOf(status))
                .stream().map(PaymentRefundResponse::from).collect(Collectors.toList());
    }

    public List<PaymentRefundResponse> getProcessedRefundsBetween(LocalDateTime from, LocalDateTime to) {
        return refundRepository.findByStatusAndProcessedAtBetween(PaymentRefundStatus.PROCESSED, from, to)
                .stream().map(PaymentRefundResponse::from).collect(Collectors.toList());
    }

    public List<PaymentRefundResponse> getMyRefunds(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return refundRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(PaymentRefundResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public PaymentRefundResponse createResidentRefundRequest(PaymentRefundRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        // Resident can only request refund on their own payments
        if (!payment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only request refunds for your own payments");
        }

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new RuntimeException("Only PAID payments can be refunded");
        }

        Optional<PaymentRefund> existing = refundRepository.findByPaymentIdAndStatusNot(
                payment.getId(), PaymentRefundStatus.REJECTED);
        if (existing.isPresent()) {
            throw new RuntimeException("A refund request already exists for this payment (status: "
                    + existing.get().getStatus() + ")");
        }

        if (request.getAmount().compareTo(payment.getAmount()) > 0) {
            throw new RuntimeException("Refund amount cannot exceed original payment amount (" + payment.getAmount() + ")");
        }

        PaymentRefund refund = PaymentRefund.builder()
                .payment(payment)
                .user(user)
                .amount(request.getAmount())
                .reason(request.getReason())
                .notes(request.getNotes())
                .status(PaymentRefundStatus.PENDING)
                .refundNumber(generateRefundNumber())
                .requestedBy(username)
                .build();

        refund = refundRepository.save(refund);

        notificationService.createNotificationForAdmins(
                "Refund Request from Resident",
                user.getFullName() + " (" + user.getUnitNumber() + ") requested a refund of Rs. " + request.getAmount()
                        + " for " + payment.getPaymentType() + " payment (Receipt: " + payment.getReceiptNumber() + ")",
                NotificationType.PAYMENT_REFUND,
                refund.getId()
        );

        return PaymentRefundResponse.from(refund);
    }

    @Transactional
    public PaymentRefundResponse createAutoRefundForBookingCancellation(Payment payment, String username) {
        // Check no existing non-REJECTED refund on this payment
        Optional<PaymentRefund> existing = refundRepository.findByPaymentIdAndStatusNot(
                payment.getId(), PaymentRefundStatus.REJECTED);
        if (existing.isPresent()) {
            return PaymentRefundResponse.from(existing.get());
        }

        PaymentRefund refund = PaymentRefund.builder()
                .payment(payment)
                .user(payment.getUser())
                .amount(payment.getAmount())
                .reason("Automatic refund — amenity booking cancelled")
                .status(PaymentRefundStatus.PENDING)
                .refundNumber(generateRefundNumber())
                .requestedBy(username)
                .build();

        refund = refundRepository.save(refund);

        notificationService.createNotificationForAdmins(
                "Auto Refund Request — Booking Cancelled",
                payment.getUser().getFullName() + " cancelled a booking. Refund of Rs. " + payment.getAmount()
                        + " requested automatically (Receipt: " + payment.getReceiptNumber() + ")",
                NotificationType.PAYMENT_REFUND,
                refund.getId()
        );

        return PaymentRefundResponse.from(refund);
    }
}
