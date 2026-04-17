package com.society.management.repository;

import com.society.management.entity.MoveRequest;
import com.society.management.entity.MoveRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MoveRequestRepository extends JpaRepository<MoveRequest, Long> {
    List<MoveRequest> findAllByOrderByCreatedAtDesc();
    List<MoveRequest> findByStatusOrderByCreatedAtDesc(MoveRequestStatus status);
    List<MoveRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
}
