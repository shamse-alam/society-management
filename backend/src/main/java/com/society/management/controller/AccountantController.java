package com.society.management.controller;

import com.society.management.dto.*;
import com.society.management.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accountant")
public class AccountantController {

    private final ExpenseService expenseService;
    private final VendorService vendorService;
    private final PaymentService paymentService;

    public AccountantController(ExpenseService expenseService, VendorService vendorService,
                                PaymentService paymentService) {
        this.expenseService = expenseService;
        this.vendorService = vendorService;
        this.paymentService = paymentService;
    }

    // ---- Expenses / Vouchers ----

    @GetMapping("/expenses")
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses() {
        return ResponseEntity.ok(expenseService.getAllExpenses());
    }

    @GetMapping("/expenses/status/{status}")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(expenseService.getExpensesByStatus(status));
    }

    @PostMapping("/expenses")
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.createExpense(request));
    }

    @PutMapping("/expenses/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.updateExpense(id, request));
    }

    @PostMapping("/expenses/{id}/bill")
    public ResponseEntity<ExpenseResponse> uploadBill(@PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(expenseService.uploadBillAttachment(id, file));
    }

    @GetMapping("/expenses/vendor/{vendorId}")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByVendor(@PathVariable Long vendorId) {
        return ResponseEntity.ok(expenseService.getExpensesByVendor(vendorId));
    }

    @PostMapping("/expenses/generate-monthly")
    public ResponseEntity<List<ExpenseResponse>> generateMonthlyVouchers(
            @RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(expenseService.generateMonthlyVouchers(year, month));
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

    @PostMapping("/vendors")
    public ResponseEntity<VendorResponse> createVendor(@Valid @RequestBody VendorRequest request) {
        return ResponseEntity.ok(vendorService.createVendor(request));
    }

    @PutMapping("/vendors/{id}")
    public ResponseEntity<VendorResponse> updateVendor(@PathVariable Long id, @Valid @RequestBody VendorRequest request) {
        return ResponseEntity.ok(vendorService.updateVendor(id, request));
    }

    @PostMapping("/vendors/{id}/logo")
    public ResponseEntity<VendorResponse> uploadVendorLogo(@PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(vendorService.uploadLogo(id, file));
    }

    // ---- Payments (record income) ----

    @PostMapping("/payments")
    public ResponseEntity<PaymentResponse> recordPayment(@Valid @RequestBody PaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(paymentService.makePayment(request, userDetails.getUsername()));
    }

    @PostMapping("/payments/{invoiceId}/record-receipt")
    public ResponseEntity<PaymentResponse> recordReceipt(@PathVariable Long invoiceId,
            @RequestBody Map<String, Object> body) {
        java.math.BigDecimal amount = new java.math.BigDecimal(body.get("amount").toString());
        return ResponseEntity.ok(paymentService.recordReceipt(invoiceId, amount));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/payments/user/{userId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(paymentService.getPaymentsByUser(userId));
    }
}
