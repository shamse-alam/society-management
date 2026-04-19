package com.society.management.service;

import com.society.management.dto.DefaulterResponse;
import com.society.management.dto.InvoiceGenerationRequest;
import com.society.management.dto.PaymentRequest;
import com.society.management.dto.PaymentResponse;
import com.society.management.dto.PenaltyRequest;
import com.society.management.entity.*;
import com.society.management.repository.PaymentRepository;
import com.society.management.repository.UserRepository;
import com.society.management.repository.PropertyRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final NotificationService notificationService;
    private final TypeConfigService typeConfigService;

    public PaymentService(PaymentRepository paymentRepository, UserRepository userRepository,
                          PropertyRepository propertyRepository, NotificationService notificationService,
                          TypeConfigService typeConfigService) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.notificationService = notificationService;
        this.typeConfigService = typeConfigService;
    }

    public PaymentResponse makePayment(PaymentRequest request, String currentUsername) {
        Long userId = request.getUserId();
        if (userId == null) {
            User current = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            userId = current.getId();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String type = request.getPaymentType();
        typeConfigService.getIncomeTypeByCode(type); // validate type exists

        Payment payment = Payment.builder()
                .user(user)
                .paymentType(type)
                .amount(request.getAmount())
                .status(PaymentStatus.PAID)
                .description(request.getDescription())
                .receiptNumber("RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .paidAt(LocalDateTime.now())
                .build();

        if (request.getPeriodFrom() != null) {
            payment.setPeriodFrom(LocalDate.parse(request.getPeriodFrom()));
        }
        if (request.getPeriodTo() != null) {
            payment.setPeriodTo(LocalDate.parse(request.getPeriodTo()));
        }

        payment = paymentRepository.save(payment);
        return PaymentResponse.from(payment);
    }

    public PaymentResponse recordReceipt(Long invoiceId, BigDecimal paidAmount) {
        Payment invoice = paymentRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        if (invoice.getStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("Invoice is not pending");
        }

        BigDecimal totalDue = invoice.getAmount().add(
                invoice.getPenaltyAmount() != null ? invoice.getPenaltyAmount() : BigDecimal.ZERO);

        if (paidAmount.compareTo(totalDue) >= 0) {
            // Full payment — mark the invoice as PAID
            invoice.setStatus(PaymentStatus.PAID);
            invoice.setReceiptNumber("RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            invoice.setPaidAt(LocalDateTime.now());
            paymentRepository.save(invoice);
            return PaymentResponse.from(invoice);
        } else {
            // Partial payment — reduce invoice amount and create a PAID record
            BigDecimal remaining = totalDue.subtract(paidAmount);

            // Adjust penalty vs principal: deduct from penalty first, then principal
            BigDecimal penalty = invoice.getPenaltyAmount() != null ? invoice.getPenaltyAmount() : BigDecimal.ZERO;
            BigDecimal penaltyPaid;
            BigDecimal principalPaid;
            if (paidAmount.compareTo(penalty) <= 0) {
                penaltyPaid = paidAmount;
                principalPaid = BigDecimal.ZERO;
            } else {
                penaltyPaid = penalty;
                principalPaid = paidAmount.subtract(penalty);
            }

            // Update original invoice with remaining amounts
            invoice.setAmount(invoice.getAmount().subtract(principalPaid));
            invoice.setPenaltyAmount(penalty.subtract(penaltyPaid));
            paymentRepository.save(invoice);

            // Create PAID receipt for the partial amount
            Payment receipt = Payment.builder()
                    .user(invoice.getUser())
                    .paymentType(invoice.getPaymentType())
                    .amount(paidAmount)
                    .status(PaymentStatus.PAID)
                    .periodFrom(invoice.getPeriodFrom())
                    .periodTo(invoice.getPeriodTo())
                    .description("Partial payment — " + invoice.getDescription())
                    .receiptNumber("RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(receipt);

            return PaymentResponse.from(receipt);
        }
    }

    public PaymentResponse updatePayment(Long id, PaymentRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            payment.setUser(user);
        }
        typeConfigService.getIncomeTypeByCode(request.getPaymentType()); // validate
        payment.setPaymentType(request.getPaymentType());
        payment.setAmount(request.getAmount());
        payment.setDescription(request.getDescription());
        payment.setPeriodFrom(request.getPeriodFrom() != null ? LocalDate.parse(request.getPeriodFrom()) : null);
        payment.setPeriodTo(request.getPeriodTo() != null ? LocalDate.parse(request.getPeriodTo()) : null);

        return PaymentResponse.from(paymentRepository.save(payment));
    }

    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        return PaymentResponse.from(payment);
    }

    public void deletePayment(Long id) {
        if (!paymentRepository.existsById(id)) {
            throw new RuntimeException("Payment not found");
        }
        paymentRepository.deleteById(id);
    }

    public List<PaymentResponse> getPaymentsByUser(Long userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(PaymentResponse::from).collect(Collectors.toList());
    }

    public List<PaymentResponse> getPaymentsByUserAndType(Long userId, String type) {
        return paymentRepository.findByUserIdAndPaymentTypeOrderByCreatedAtDesc(userId, type).stream()
                .map(PaymentResponse::from).collect(Collectors.toList());
    }

    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(PaymentResponse::from).collect(Collectors.toList());
    }

    public List<PaymentResponse> getAllPaymentsByType(String type) {
        return paymentRepository.findByPaymentTypeOrderByCreatedAtDesc(type).stream()
                .map(PaymentResponse::from).collect(Collectors.toList());
    }

    public List<PaymentResponse> getMyPayments(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(PaymentResponse::from).collect(Collectors.toList());
    }

    public List<PaymentResponse> getMyPaymentsByType(String username, String type) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return paymentRepository.findByUserIdAndPaymentTypeOrderByCreatedAtDesc(user.getId(), type).stream()
                .map(PaymentResponse::from).collect(Collectors.toList());
    }

    public List<DefaulterResponse> getDefaulters() {
        List<Payment> pendingPayments = paymentRepository.findByStatus(PaymentStatus.PENDING);

        Map<Long, List<Payment>> grouped = pendingPayments.stream()
                .collect(Collectors.groupingBy(p -> p.getUser().getId()));

        return grouped.entrySet().stream().map(entry -> {
            List<Payment> payments = entry.getValue();
            User user = payments.get(0).getUser();

            DefaulterResponse r = new DefaulterResponse();
            r.setUserId(user.getId());
            r.setFirstName(user.getFirstName());
            r.setLastName(user.getLastName());
            r.setFullName(user.getFullName());
            r.setUnitNumber(user.getUnitNumber());
            r.setPhone(user.getPhone());
            r.setEmail(user.getEmail());
            r.setPendingCount(payments.size());

            BigDecimal totalDue = payments.stream()
                    .map(p -> p.getAmount().add(p.getPenaltyAmount() != null ? p.getPenaltyAmount() : BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            r.setTotalDue(totalDue);

            LocalDate oldest = payments.stream()
                    .map(p -> p.getDueDate() != null ? p.getDueDate() : p.getCreatedAt().toLocalDate())
                    .min(LocalDate::compareTo).orElse(null);
            r.setOldestDueDate(oldest != null ? oldest.toString() : null);

            if (oldest != null) {
                r.setDaysOverdue(java.time.temporal.ChronoUnit.DAYS.between(oldest, LocalDate.now()));
            }

            r.setPendingPayments(payments.stream().map(PaymentResponse::from).collect(Collectors.toList()));

            return r;
        }).sorted((a, b) -> b.getTotalDue().compareTo(a.getTotalDue()))
          .collect(Collectors.toList());
    }

    public Map<String, Object> generateInvoices(InvoiceGenerationRequest request) {
        String type = request.getPaymentType();
        IncomeType incomeType = typeConfigService.getIncomeTypeByCode(type);
        boolean oneTime = "ONE_TIME".equals(request.getPeriodMode());

        LocalDate periodFrom = null;
        LocalDate periodTo = null;
        String periodLabel;
        if (oneTime) {
            periodLabel = "One Time";
        } else if ("CUSTOM".equals(request.getPeriodMode()) && request.getPeriodFrom() != null && request.getPeriodTo() != null) {
            periodFrom = request.getPeriodFrom();
            periodTo = request.getPeriodTo();
            if (periodFrom.getYear() < 2000 || periodTo.getYear() < 2000) {
                throw new RuntimeException("Invalid date — year must be 2000 or later");
            }
            periodLabel = periodFrom + " to " + periodTo;
        } else {
            if (request.getYear() != null && request.getYear() < 2000) {
                throw new RuntimeException("Invalid year — must be 2000 or later");
            }
            periodFrom = LocalDate.of(request.getYear(), request.getMonth(), 1);
            periodTo = periodFrom.withDayOfMonth(periodFrom.lengthOfMonth());
            periodLabel = periodFrom.getMonth() + " " + request.getYear();
        }

        LocalDate dueDate = oneTime
                ? (request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(request.getDueDays()))
                : periodFrom.plusDays(request.getDueDays());
        boolean perSqFt = "PER_SQFT".equals(request.getCalculationMode());

        // Build a property lookup by unit number for area-based calculation
        Map<String, Property> propertyMap = propertyRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(Property::getUnitNumber, p -> p, (a, b) -> a));

        // Find all users with RESIDENT role — any user who is a resident pays dues
        List<User> residents = userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().toUpperCase().contains("RESIDENT"))
                .toList();

        int generated = 0;
        int skipped = 0;

        for (User resident : residents) {
            // Check duplicates: for one-time, check if any invoice of this type exists; for periodic, check exact period
            if (oneTime) {
                List<Payment> existing = paymentRepository.findByUserIdAndPaymentType(resident.getId(), type);
                if (!existing.isEmpty()) {
                    skipped++;
                    continue;
                }
            } else {
                List<Payment> existing = paymentRepository.findByUserIdAndPaymentTypeAndPeriodFromAndPeriodTo(
                        resident.getId(), type, periodFrom, periodTo);
                if (!existing.isEmpty()) {
                    skipped++;
                    continue;
                }
            }

            BigDecimal amount;
            Property property = resident.getUnitNumber() != null ? propertyMap.get(resident.getUnitNumber()) : null;
            if (perSqFt && request.getRatePerSqFt() != null && property != null
                    && property.getAreaInSqFt() != null && property.getAreaInSqFt() > 0) {
                amount = request.getRatePerSqFt().multiply(BigDecimal.valueOf(property.getAreaInSqFt()));
            } else {
                amount = request.getAmountPerUnit();
            }

            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                skipped++;
                continue;
            }

            Payment payment = Payment.builder()
                    .user(resident)
                    .paymentType(type)
                    .amount(amount)
                    .status(PaymentStatus.PENDING)
                    .receiptNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .periodFrom(periodFrom)
                    .periodTo(periodTo)
                    .dueDate(dueDate)
                    .description(incomeType.getDisplayName() + " — " + periodLabel)
                    .paidAt(null)
                    .build();

            paymentRepository.save(payment);
            generated++;

            notificationService.createNotification(
                    resident,
                    "Payment Due: " + incomeType.getDisplayName(),
                    "Rs. " + amount + " due by " + dueDate + " — " + periodLabel,
                    NotificationType.PAYMENT_DUE,
                    payment.getId()
            );
        }

        return Map.of("generated", generated, "skipped", skipped, "total", residents.size());
    }

    public Map<String, Object> applyPenalties(PenaltyRequest request) {
        List<Payment> overdue = paymentRepository.findByStatusAndDueDateBefore(
                PaymentStatus.PENDING, LocalDate.now());

        int applied = 0;
        for (Payment payment : overdue) {
            long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(payment.getDueDate(), LocalDate.now());
            if (daysOverdue <= 0) continue;

            // 18% p.a. on total amount: penalty = amount × (rate/100) × (daysOverdue/365)
            BigDecimal penalty = payment.getAmount()
                    .multiply(request.getAnnualRate())
                    .multiply(BigDecimal.valueOf(daysOverdue))
                    .divide(BigDecimal.valueOf(36500), 2, RoundingMode.HALF_UP);

            BigDecimal oldPenalty = payment.getPenaltyAmount() != null ? payment.getPenaltyAmount() : BigDecimal.ZERO;

            payment.setPenaltyAmount(penalty);
            payment.setPenaltyApplied(true);
            paymentRepository.save(payment);
            applied++;

            // Only notify if penalty changed
            if (penalty.compareTo(oldPenalty) != 0) {
                notificationService.createNotification(
                        payment.getUser(),
                        "Late Fee Updated",
                        "A penalty of Rs. " + penalty + " (" + daysOverdue + " days overdue @ " + request.getAnnualRate() + "% p.a.) has been applied to your " + payment.getPaymentType() + " payment",
                        NotificationType.PAYMENT_REMINDER,
                        payment.getId()
                );
            }
        }

        return Map.of("applied", applied, "totalOverdue", overdue.size());
    }
}
