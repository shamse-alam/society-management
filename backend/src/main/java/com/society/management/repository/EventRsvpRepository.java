package com.society.management.repository;

import com.society.management.entity.EventRsvp;
import com.society.management.entity.RsvpStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventRsvpRepository extends JpaRepository<EventRsvp, Long> {
    Optional<EventRsvp> findByEventIdAndUserId(Long eventId, Long userId);
    List<EventRsvp> findByEventId(Long eventId);
    int countByEventIdAndStatus(Long eventId, RsvpStatus status);
}
