package com.society.management.repository;

import com.society.management.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findAllByOrderByCreatedAtDesc();
    List<Notice> findByActiveTrueAndExpiresAtIsNullOrActiveTrueAndExpiresAtGreaterThanEqualOrderByCreatedAtDesc(LocalDate date);
}
