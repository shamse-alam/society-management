package com.society.management.repository;

import com.society.management.entity.VisitLog;
import com.society.management.entity.VisitStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VisitLogRepository extends JpaRepository<VisitLog, Long> {
    Optional<VisitLog> findByPasscodeAndStatus(String passcode, VisitStatus status);
    List<VisitLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<VisitLog> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);
    List<VisitLog> findByStatus(VisitStatus status);
    List<VisitLog> findByStatusIn(List<VisitStatus> statuses);
    long countByStatusAndCreatedAtBetween(VisitStatus status, LocalDateTime start, LocalDateTime end);
    List<VisitLog> findByStatusAndValidUntilBefore(VisitStatus status, LocalDateTime time);
    List<VisitLog> findAllByOrderByCreatedAtDesc();
    List<VisitLog> findByStatusAndCreatedAtBetween(VisitStatus status, LocalDateTime start, LocalDateTime end);
    List<VisitLog> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, VisitStatus status);
}
