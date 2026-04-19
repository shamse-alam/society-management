package com.society.management.repository;

import com.society.management.entity.DailyHelp;
import com.society.management.entity.DailyHelpStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DailyHelpRepository extends JpaRepository<DailyHelp, Long> {
    List<DailyHelp> findByUserIdAndActiveTrue(Long userId);
    List<DailyHelp> findByPropertyIdAndActiveTrue(Long propertyId);
    List<DailyHelp> findAllByActiveTrue();
    List<DailyHelp> findAllByActiveTrueAndStatus(DailyHelpStatus status);
    List<DailyHelp> findByUserIdAndStatus(Long userId, DailyHelpStatus status);
    List<DailyHelp> findAllByPropertyIsNullAndActiveTrue();
}
