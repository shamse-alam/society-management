package com.society.management.repository;

import com.society.management.entity.VisitorParking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VisitorParkingRepository extends JpaRepository<VisitorParking, Long> {
    List<VisitorParking> findByCheckOutIsNullOrderByCheckInDesc();
    List<VisitorParking> findAllByOrderByCheckInDesc();
    List<VisitorParking> findBySlotIdAndCheckOutIsNull(Long slotId);
}
