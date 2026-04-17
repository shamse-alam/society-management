package com.society.management.repository;

import com.society.management.entity.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {
    List<EmergencyContact> findByActiveTrueOrderByDisplayOrderAsc();
    List<EmergencyContact> findAllByOrderByDisplayOrderAsc();
}
