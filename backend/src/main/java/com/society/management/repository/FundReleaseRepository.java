package com.society.management.repository;

import com.society.management.entity.FundRelease;
import com.society.management.entity.FundReleaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FundReleaseRepository extends JpaRepository<FundRelease, Long> {
    List<FundRelease> findAllByOrderByCreatedAtDesc();
    List<FundRelease> findByStatusOrderByCreatedAtDesc(FundReleaseStatus status);
    List<FundRelease> findByFundTypeOrderByCreatedAtDesc(String fundType);
    List<FundRelease> findByStatusAndFundType(FundReleaseStatus status, String fundType);
    List<FundRelease> findByStatusIn(List<FundReleaseStatus> statuses);
}
