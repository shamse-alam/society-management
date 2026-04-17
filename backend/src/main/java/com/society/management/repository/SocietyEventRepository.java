package com.society.management.repository;

import com.society.management.entity.SocietyEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SocietyEventRepository extends JpaRepository<SocietyEvent, Long> {
    List<SocietyEvent> findByActiveTrueOrderByStartTimeDesc();
}
