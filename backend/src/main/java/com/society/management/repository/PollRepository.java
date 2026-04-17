package com.society.management.repository;

import com.society.management.entity.Poll;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PollRepository extends JpaRepository<Poll, Long> {
    List<Poll> findAllByOrderByCreatedAtDesc();
    List<Poll> findByActiveTrueOrderByCreatedAtDesc();
}
