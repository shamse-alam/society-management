package com.society.management.repository;

import com.society.management.entity.PaymentRefund;
import com.society.management.entity.PaymentRefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRefundRepository extends JpaRepository<PaymentRefund, Long> {

    List<PaymentRefund> findAllByOrderByCreatedAtDesc();

    List<PaymentRefund> findByStatusOrderByCreatedAtDesc(PaymentRefundStatus status);

    Optional<PaymentRefund> findByPaymentIdAndStatusNot(Long paymentId, PaymentRefundStatus status);

    List<PaymentRefund> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<PaymentRefund> findByStatusIn(List<PaymentRefundStatus> statuses);

    List<PaymentRefund> findByStatusAndProcessedAtBetween(PaymentRefundStatus status, LocalDateTime from, LocalDateTime to);

    Optional<PaymentRefund> findTopByRefundNumberStartingWithOrderByRefundNumberDesc(String prefix);
}
