package com.society.management.repository;

import com.society.management.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VisitorRepository extends JpaRepository<Visitor, Long> {
    Optional<Visitor> findByPhone(String phone);
    List<Visitor> findByNameContainingIgnoreCase(String name);
}
