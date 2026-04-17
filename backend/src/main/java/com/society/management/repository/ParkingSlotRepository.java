package com.society.management.repository;

import com.society.management.entity.ParkingSlot;
import com.society.management.entity.ParkingSlotType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
    List<ParkingSlot> findByActiveTrueOrderBySlotNumberAsc();
    List<ParkingSlot> findByAssignedPropertyIdAndActiveTrueOrderBySlotNumberAsc(Long propertyId);
    List<ParkingSlot> findByOccupiedFalseAndSlotTypeAndActiveTrueOrderBySlotNumberAsc(ParkingSlotType slotType);
    List<ParkingSlot> findByOccupiedFalseAndActiveTrueOrderBySlotNumberAsc();
    Optional<ParkingSlot> findBySlotNumberAndActiveTrue(String slotNumber);
    boolean existsBySlotNumberAndActiveTrue(String slotNumber);
}
