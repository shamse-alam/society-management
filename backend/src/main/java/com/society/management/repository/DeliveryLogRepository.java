package com.society.management.repository;

import com.society.management.entity.DeliveryLog;
import com.society.management.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryLogRepository extends JpaRepository<DeliveryLog, Long> {
    List<DeliveryLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<DeliveryLog> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);
    List<DeliveryLog> findByStatus(DeliveryStatus status);
}
