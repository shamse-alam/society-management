package com.society.management.repository;

import com.society.management.entity.PropertyHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PropertyHistoryRepository extends JpaRepository<PropertyHistory, Long> {
    List<PropertyHistory> findByPropertyIdOrderByChangedAtDesc(Long propertyId);
    List<PropertyHistory> findByPropertyIdAndChangeTypeOrderByChangedAtDesc(Long propertyId, String changeType);
}
