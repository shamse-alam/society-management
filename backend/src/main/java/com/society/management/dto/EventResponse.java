package com.society.management.dto;

import com.society.management.entity.SocietyEvent;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private String venue;
    private String category;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Integer maxAttendees;
    private String organizerName;
    private int goingCount;
    private int maybeCount;
    private String myRsvp;
    private LocalDateTime createdAt;

    public static EventResponse from(SocietyEvent e) {
        EventResponse r = new EventResponse();
        r.setId(e.getId());
        r.setTitle(e.getTitle());
        r.setDescription(e.getDescription());
        r.setVenue(e.getVenue());
        r.setCategory(e.getCategory());
        r.setStartTime(e.getStartTime());
        r.setEndTime(e.getEndTime());
        r.setStatus(e.getStatus() != null ? e.getStatus().name() : null);
        r.setMaxAttendees(e.getMaxAttendees());
        r.setOrganizerName(e.getOrganizer() != null ? e.getOrganizer().getFullName() : null);
        r.setCreatedAt(e.getCreatedAt());
        return r;
    }
}
