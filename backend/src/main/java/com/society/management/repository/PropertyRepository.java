package com.society.management.repository;

import com.society.management.entity.Property;
import com.society.management.entity.PropertyStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {
    Optional<Property> findByUnitNumber(String unitNumber);
    List<Property> findByStatus(PropertyStatus status);
    boolean existsByUnitNumber(String unitNumber);
}
