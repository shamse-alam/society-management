package com.society.management.repository;

import com.society.management.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByActiveTrueOrderByPropertyUnitNumberAscCreatedAtDesc();
    List<Vehicle> findByPropertyIdAndActiveTrueOrderByCreatedAtDesc(Long propertyId);
    List<Vehicle> findByPropertyUnitNumberAndActiveTrueOrderByCreatedAtDesc(String unitNumber);
    Optional<Vehicle> findByVehicleNumberAndActiveTrue(String vehicleNumber);
    boolean existsByVehicleNumberAndActiveTrue(String vehicleNumber);
}
