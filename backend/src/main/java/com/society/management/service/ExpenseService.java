package com.society.management.service;

import com.society.management.dto.*;
import com.society.management.entity.*;
import com.society.management.repository.ExpenseRepository;
import com.society.management.repository.FundReleaseRepository;
import com.society.management.repository.PaymentRefundRepository;
import com.society.management.repository.PaymentRepository;
import com.society.management.repository.UserRepository;
import com.society.management.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final PaymentRepository paymentRepository;
    private final FundReleaseRepository fundReleaseRepository;
    private final PaymentRefundRepository paymentRefundRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SocietyConfigService societyConfigService;
    private final TypeConfigService typeConfigService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public ExpenseService(ExpenseRepository expenseRepository, PaymentRepository paymentRepository,
                          FundReleaseRepository fundReleaseRepository,
                          PaymentRefundRepository paymentRefundRepository,
                          VendorRepository vendorRepository, UserRepository userRepository,
                          EmailService emailService, SocietyConfigService societyConfigService,
                          TypeConfigService typeConfigService) {
        this.expenseRepository = expenseRepository;
        this.paymentRepository = paymentRepository;
        this.fundReleaseRepository = fundReleaseRepository;
        this.paymentRefundRepository = paymentRefundRepository;
        this.vendorRepository = vendorRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.societyConfigService = societyConfigService;
        this.typeConfigService = typeConfigService;
    }

    private String generateVoucherNumber() {
        String prefix = "VCH-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        Optional<Expense> latest = expenseRepository.findTopByVoucherNumberStartingWithOrderByVoucherNumberDesc(prefix);
        int nextSeq = 1;
        if (latest.isPresent()) {
            String lastNum = latest.get().getVoucherNumber().substring(prefix.length());
            nextSeq = Integer.parseInt(lastNum) + 1;
        }
        return prefix + String.format("%04d", nextSeq);
    }

    public List<ExpenseResponse> getAllExpenses() {
        return expenseRepository.findAllByOrderByExpenseDateDesc().stream()
                .map(ExpenseResponse::from)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getExpensesByStatus(String status) {
        return expenseRepository.findByStatusOrderByExpenseDateDesc(ExpenseStatus.valueOf(status))
                .stream().map(ExpenseResponse::from).collect(Collectors.toList());
    }

    public ExpenseResponse createExpense(ExpenseRequest request) {
        Expense expense = Expense.builder()
                .category(request.getCategory())
                .amount(request.getAmount())
                .description(request.getDescription())
                .paidTo(request.getPaidTo())
                .expenseDate(LocalDate.parse(request.getExpenseDate()))
                .voucherNumber(generateVoucherNumber())
                .status(ExpenseStatus.DRAFT)
                .notes(request.getNotes())
                .build();

        if (request.getVendorId() != null) {
            Vendor vendor = vendorRepository.findById(request.getVendorId())
                    .orElseThrow(() -> new RuntimeException("Vendor not found"));
            expense.setVendor(vendor);
            if (expense.getPaidTo() == null || expense.getPaidTo().isBlank()) {
                expense.setPaidTo(vendor.getName());
            }
        }

        applyPaymentDetails(expense, request);

        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    public ExpenseResponse updateExpense(Long id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        if (expense.getStatus() == ExpenseStatus.PAID) {
            throw new RuntimeException("Cannot edit a paid expense");
        }
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        expense.setPaidTo(request.getPaidTo());
        expense.setExpenseDate(LocalDate.parse(request.getExpenseDate()));
        expense.setNotes(request.getNotes());
        if (request.getVendorId() != null) {
            Vendor vendor = vendorRepository.findById(request.getVendorId())
                    .orElseThrow(() -> new RuntimeException("Vendor not found"));
            expense.setVendor(vendor);
        } else {
            expense.setVendor(null);
        }
        applyPaymentDetails(expense, request);
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    public ExpenseResponse approveExpense(Long id, String username) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        if (expense.getStatus() != ExpenseStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT expenses can be approved");
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
                throw new RuntimeException("You do not have permission to approve expenses. Required roles: " + approvalRolesStr);
            }
        }

        expense.setStatus(ExpenseStatus.APPROVED);
        expense.setApprovedBy(username);
        expense.setApprovedAt(LocalDateTime.now());
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    public ExpenseResponse markAsPaid(Long id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        if (expense.getStatus() != ExpenseStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED expenses can be marked as paid");
        }
        expense.setStatus(ExpenseStatus.PAID);
        applyPaymentDetails(expense, request);
        Expense saved = expenseRepository.save(expense);

        if (saved.getVendor() != null && saved.getVendor().getEmail() != null && !saved.getVendor().getEmail().isBlank()) {
            emailService.sendPaymentConfirmationToVendor(saved);
        }

        return ExpenseResponse.from(saved);
    }

    public ExpenseResponse cancelExpense(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        if (expense.getStatus() == ExpenseStatus.PAID) {
            throw new RuntimeException("Cannot cancel a paid expense");
        }
        expense.setStatus(ExpenseStatus.CANCELLED);
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    public List<ExpenseResponse> generateMonthlyVouchers(int year, int month) {
        List<Vendor> contractVendors = vendorRepository.findByVendorTypeAndActiveTrueOrderByNameAsc(VendorType.CONTRACT);
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
        List<ExpenseResponse> generated = new ArrayList<>();

        for (Vendor vendor : contractVendors) {
            if (vendor.getMonthlyAmount() == null || vendor.getMonthlyAmount().compareTo(BigDecimal.ZERO) <= 0) continue;

            if (vendor.getContractStartDate() != null && vendor.getContractStartDate().isAfter(monthEnd)) continue;
            if (vendor.getContractEndDate() != null && vendor.getContractEndDate().isBefore(monthStart)) continue;

            List<Expense> existing = expenseRepository.findByVendorIdAndExpenseDateBetween(vendor.getId(), monthStart, monthEnd);
            if (!existing.isEmpty()) continue;

            BigDecimal amount = vendor.getMonthlyAmount();
            int totalDays = monthStart.lengthOfMonth();

            if (vendor.getContractStartDate() != null && vendor.getContractStartDate().isAfter(monthStart) && !vendor.getContractStartDate().isAfter(monthEnd)) {
                int activeDays = monthEnd.getDayOfMonth() - vendor.getContractStartDate().getDayOfMonth() + 1;
                amount = vendor.getMonthlyAmount().multiply(BigDecimal.valueOf(activeDays))
                        .divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);
            } else if (vendor.getContractEndDate() != null && !vendor.getContractEndDate().isBefore(monthStart) && vendor.getContractEndDate().isBefore(monthEnd)) {
                int activeDays = vendor.getContractEndDate().getDayOfMonth();
                amount = vendor.getMonthlyAmount().multiply(BigDecimal.valueOf(activeDays))
                        .divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);
            }

            String monthLabel = monthStart.getMonth().toString() + " " + year;

            Expense expense = Expense.builder()
                    .category(vendor.getCategory())
                    .amount(amount)
                    .description("Monthly payment - " + vendor.getName() + " - " + monthLabel)
                    .paidTo(vendor.getName())
                    .vendor(vendor)
                    .expenseDate(monthEnd)
                    .voucherNumber(generateVoucherNumber())
                    .status(ExpenseStatus.DRAFT)
                    .build();

            generated.add(ExpenseResponse.from(expenseRepository.save(expense)));
        }

        return generated;
    }

    public ExpenseResponse uploadBillAttachment(Long id, MultipartFile file) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        try {
            Path uploadPath = Paths.get(uploadDir, "bills");
            Files.createDirectories(uploadPath);
            String ext = "";
            String origName = file.getOriginalFilename();
            if (origName != null && origName.contains(".")) ext = origName.substring(origName.lastIndexOf("."));
            String filename = "bill_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Files.copy(file.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            expense.setBillAttachment("/api/uploads/bills/" + filename);
            return ExpenseResponse.from(expenseRepository.save(expense));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload bill: " + e.getMessage());
        }
    }

    private void applyPaymentDetails(Expense expense, ExpenseRequest request) {
        if (request.getPaymentMode() != null && !request.getPaymentMode().isBlank()) {
            expense.setPaymentMode(PaymentMode.valueOf(request.getPaymentMode()));
        }
        if (request.getChequeNumber() != null) expense.setChequeNumber(request.getChequeNumber());
        if (request.getChequeDate() != null && !request.getChequeDate().isBlank()) expense.setChequeDate(LocalDate.parse(request.getChequeDate()));
        if (request.getChequeBankName() != null) expense.setChequeBankName(request.getChequeBankName());
        if (request.getTransactionReference() != null) expense.setTransactionReference(request.getTransactionReference());
        if (request.getTransactionDate() != null && !request.getTransactionDate().isBlank()) expense.setTransactionDate(LocalDate.parse(request.getTransactionDate()));
    }

    public List<ExpenseResponse> getExpensesByVendor(Long vendorId) {
        return expenseRepository.findByVendorIdOrderByExpenseDateDesc(vendorId).stream()
                .map(ExpenseResponse::from).collect(Collectors.toList());
    }

    public void deleteExpense(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        if (expense.getStatus() == ExpenseStatus.PAID) {
            throw new RuntimeException("Cannot delete a paid expense");
        }
        expenseRepository.deleteById(id);
    }

    public BalanceSheetResponse getBalanceSheet(LocalDate from, LocalDate to) {
        List<Payment> allPayments = paymentRepository.findAllByOrderByCreatedAtDesc();
        List<Payment> paidPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .filter(p -> {
                    if (from == null || to == null) return true;
                    LocalDate pDate = p.getPaidAt() != null ? p.getPaidAt().toLocalDate() : p.getCreatedAt().toLocalDate();
                    return !pDate.isBefore(from) && !pDate.isAfter(to);
                })
                .collect(Collectors.toList());

        List<Expense> expenses;
        if (from != null && to != null) {
            expenses = expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDesc(from, to);
        } else {
            expenses = expenseRepository.findAllByOrderByExpenseDateDesc();
        }
        expenses = expenses.stream()
                .filter(e -> e.getStatus() == null || e.getStatus() == ExpenseStatus.PAID)
                .collect(Collectors.toList());

        BigDecimal totalIncome = paidPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> incomeByType = new LinkedHashMap<>();
        Map<String, Integer> incomeCountByType = new LinkedHashMap<>();
        for (Payment p : paidPayments) {
            String type = p.getPaymentType();
            incomeByType.merge(type, p.getAmount(), BigDecimal::add);
            incomeCountByType.merge(type, 1, Integer::sum);
        }
        List<BalanceSheetResponse.IncomeEntry> incomeBreakdown = new ArrayList<>();
        incomeByType.forEach((type, amount) -> {
            boolean gstApplicable = true;
            try { gstApplicable = typeConfigService.getIncomeTypeByCode(type).isGstApplicable(); } catch (Exception ignored) {}
            incomeBreakdown.add(new BalanceSheetResponse.IncomeEntry(type, amount, incomeCountByType.get(type), gstApplicable));
        });

        Map<String, BigDecimal> expenseByCat = new LinkedHashMap<>();
        Map<String, Integer> expenseCountByCat = new LinkedHashMap<>();
        for (Expense e : expenses) {
            expenseByCat.merge(e.getCategory(), e.getAmount(), BigDecimal::add);
            expenseCountByCat.merge(e.getCategory(), 1, Integer::sum);
        }
        List<BalanceSheetResponse.ExpenseEntry> expenseBreakdown = new ArrayList<>();
        expenseByCat.forEach((cat, amount) -> {
            ExpenseType et = typeConfigService.getExpenseTypeByCode(cat);
            expenseBreakdown.add(new BalanceSheetResponse.ExpenseEntry(cat, amount, expenseCountByCat.get(cat),
                    et != null && et.isGstIncluded()));
        });

        List<BalanceSheetResponse.IncomeLineItem> incomeItems = paidPayments.stream()
                .map(p -> new BalanceSheetResponse.IncomeLineItem(
                        p.getPaidAt() != null ? p.getPaidAt().toLocalDate().toString() : p.getCreatedAt().toLocalDate().toString(),
                        p.getPaymentType(),
                        p.getUser().getFullName(),
                        p.getAmount(),
                        p.getDescription()
                ))
                .collect(Collectors.toList());

        List<ExpenseResponse> expenseItems = expenses.stream()
                .map(ExpenseResponse::from)
                .collect(Collectors.toList());

        // Refund calculations — PROCESSED refunds within date range
        List<PaymentRefund> processedRefunds;
        if (from != null && to != null) {
            processedRefunds = paymentRefundRepository.findByStatusAndProcessedAtBetween(
                    PaymentRefundStatus.PROCESSED,
                    from.atStartOfDay(), to.plusDays(1).atStartOfDay());
        } else {
            processedRefunds = paymentRefundRepository.findByStatusIn(
                    List.of(PaymentRefundStatus.PROCESSED));
        }

        BigDecimal totalRefunds = processedRefunds.stream()
                .map(PaymentRefund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> refundByType = new LinkedHashMap<>();
        Map<String, Integer> refundCountByType = new LinkedHashMap<>();
        for (PaymentRefund r : processedRefunds) {
            String type = r.getPayment().getPaymentType();
            refundByType.merge(type, r.getAmount(), BigDecimal::add);
            refundCountByType.merge(type, 1, Integer::sum);
        }
        List<BalanceSheetResponse.RefundEntry> refundBreakdown = new ArrayList<>();
        refundByType.forEach((type, amount) -> {
            boolean gstApplicable = true;
            try { gstApplicable = typeConfigService.getIncomeTypeByCode(type).isGstApplicable(); } catch (Exception ignored) {}
            refundBreakdown.add(new BalanceSheetResponse.RefundEntry(type, amount, refundCountByType.get(type), gstApplicable));
        });

        // Reserve fund calculations — dynamic from type config
        Set<String> reserveTypeCodes = typeConfigService.getReserveFundTypes().stream()
                .map(IncomeTypeResponse::getCode)
                .collect(Collectors.toSet());

        BigDecimal operationalIncome = paidPayments.stream()
                .filter(p -> !reserveTypeCodes.contains(p.getPaymentType()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalReserveFunds = paidPayments.stream()
                .filter(p -> reserveTypeCodes.contains(p.getPaymentType()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<FundReleaseStatus> releasedStatuses = List.of(FundReleaseStatus.APPROVED, FundReleaseStatus.RELEASED);
        List<FundRelease> releasedFunds = fundReleaseRepository.findByStatusIn(releasedStatuses);

        BigDecimal releasedReserveFunds = releasedFunds.stream()
                .map(FundRelease::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal lockedReserveFunds = totalReserveFunds.subtract(releasedReserveFunds).max(BigDecimal.ZERO);
        BigDecimal availableBalance = operationalIncome.add(releasedReserveFunds).subtract(totalExpense).subtract(totalRefunds);

        List<BalanceSheetResponse.ReserveFundEntry> reserveBreakdown = new ArrayList<>();
        for (String rt : reserveTypeCodes) {
            BigDecimal collected = paidPayments.stream()
                    .filter(p -> rt.equals(p.getPaymentType()))
                    .map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal released = releasedFunds.stream()
                    .filter(fr -> rt.equals(fr.getFundType()))
                    .map(FundRelease::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            reserveBreakdown.add(new BalanceSheetResponse.ReserveFundEntry(
                    rt, collected, released, collected.subtract(released).max(BigDecimal.ZERO)));
        }

        BalanceSheetResponse res = new BalanceSheetResponse();
        res.setTotalIncome(totalIncome);
        res.setTotalExpense(totalExpense);
        res.setBalance(totalIncome.subtract(totalRefunds).subtract(totalExpense));
        res.setTotalRefunds(totalRefunds);
        res.setRefundCount(processedRefunds.size());
        res.setRefundBreakdown(refundBreakdown);
        res.setIncomeBreakdown(incomeBreakdown);
        res.setExpenseBreakdown(expenseBreakdown);
        res.setIncomeItems(incomeItems);
        res.setExpenseItems(expenseItems);
        res.setOperationalIncome(operationalIncome);
        res.setTotalReserveFunds(totalReserveFunds);
        res.setReleasedReserveFunds(releasedReserveFunds);
        res.setLockedReserveFunds(lockedReserveFunds);
        res.setAvailableBalance(availableBalance);
        res.setReserveBreakdown(reserveBreakdown);
        return res;
    }
}
