package com.society.management.repository;

import com.society.management.entity.PollVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PollVoteRepository extends JpaRepository<PollVote, Long> {
    Optional<PollVote> findByPollIdAndUserId(Long pollId, Long userId);
    boolean existsByPollIdAndUserId(Long pollId, Long userId);
}
