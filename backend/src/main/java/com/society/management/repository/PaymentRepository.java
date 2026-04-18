package com.society.management.repository;

import com.society.management.entity.Payment;
import com.society.management.entity.PaymentStatus;
import com.society.management.entity.PaymentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Payment> findByUserIdAndPaymentTypeOrderByCreatedAtDesc(Long userId, PaymentType type);
    List<Payment> findByPaymentTypeOrderByCreatedAtDesc(PaymentType type);
    List<Payment> findAllByOrderByCreatedAtDesc();
    Optional<Payment> findByBookingId(Long bookingId);
    List<Payment> findByStatusAndPenaltyAppliedFalseAndDueDateBefore(PaymentStatus status, LocalDate date);
    List<Payment> findByStatusAndDueDateBefore(PaymentStatus status, LocalDate date);
    List<Payment> findByStatus(PaymentStatus status);
    List<Payment> findByUserIdAndPaymentTypeAndPeriodFromAndPeriodTo(Long userId, PaymentType type, LocalDate from, LocalDate to);
    List<Payment> findByUserIdAndPaymentType(Long userId, PaymentType type);
}
