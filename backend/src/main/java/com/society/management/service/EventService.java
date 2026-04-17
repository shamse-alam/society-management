package com.society.management.service;

import com.society.management.dto.EventRequest;
import com.society.management.dto.EventResponse;
import com.society.management.dto.RsvpRequest;
import com.society.management.entity.*;
import com.society.management.repository.EventRsvpRepository;
import com.society.management.repository.SocietyEventRepository;
import com.society.management.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    private final SocietyEventRepository eventRepository;
    private final EventRsvpRepository rsvpRepository;
    private final UserRepository userRepository;

    public EventService(SocietyEventRepository eventRepository, EventRsvpRepository rsvpRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.rsvpRepository = rsvpRepository;
        this.userRepository = userRepository;
    }

    public List<EventResponse> getAllEvents(String username) {
        User user = username != null ? userRepository.findByUsername(username).orElse(null) : null;
        return eventRepository.findByActiveTrueOrderByStartTimeDesc().stream().map(e -> {
            EventResponse r = EventResponse.from(e);
            r.setGoingCount(rsvpRepository.countByEventIdAndStatus(e.getId(), RsvpStatus.GOING));
            r.setMaybeCount(rsvpRepository.countByEventIdAndStatus(e.getId(), RsvpStatus.MAYBE));
            if (user != null) {
                rsvpRepository.findByEventIdAndUserId(e.getId(), user.getId())
                        .ifPresent(rsvp -> r.setMyRsvp(rsvp.getStatus().name()));
            }
            return r;
        }).toList();
    }

    public EventResponse createEvent(EventRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        SocietyEvent event = SocietyEvent.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .venue(req.getVenue())
                .category(req.getCategory())
                .startTime(req.getStartTime() != null ? LocalDateTime.parse(req.getStartTime()) : null)
                .endTime(req.getEndTime() != null ? LocalDateTime.parse(req.getEndTime()) : null)
                .maxAttendees(req.getMaxAttendees())
                .organizer(user)
                .build();
        return EventResponse.from(eventRepository.save(event));
    }

    public EventResponse updateEvent(Long id, EventRequest req) {
        SocietyEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        event.setTitle(req.getTitle());
        event.setDescription(req.getDescription());
        event.setVenue(req.getVenue());
        event.setCategory(req.getCategory());
        if (req.getStartTime() != null) event.setStartTime(LocalDateTime.parse(req.getStartTime()));
        if (req.getEndTime() != null) event.setEndTime(LocalDateTime.parse(req.getEndTime()));
        if (req.getStatus() != null) event.setStatus(EventStatus.valueOf(req.getStatus()));
        event.setMaxAttendees(req.getMaxAttendees());
        return EventResponse.from(eventRepository.save(event));
    }

    public void deleteEvent(Long id) {
        SocietyEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        event.setActive(false);
        eventRepository.save(event);
    }

    public EventResponse rsvp(Long eventId, RsvpRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        SocietyEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        EventRsvp rsvp = rsvpRepository.findByEventIdAndUserId(eventId, user.getId())
                .orElse(EventRsvp.builder().event(event).user(user).build());
        rsvp.setStatus(RsvpStatus.valueOf(req.getStatus()));
        rsvp.setGuestCount(req.getGuestCount());
        rsvp.setNotes(req.getNotes());
        rsvpRepository.save(rsvp);

        EventResponse r = EventResponse.from(event);
        r.setGoingCount(rsvpRepository.countByEventIdAndStatus(eventId, RsvpStatus.GOING));
        r.setMaybeCount(rsvpRepository.countByEventIdAndStatus(eventId, RsvpStatus.MAYBE));
        r.setMyRsvp(req.getStatus());
        return r;
    }

    public void cancelRsvp(Long eventId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        rsvpRepository.findByEventIdAndUserId(eventId, user.getId())
                .ifPresent(rsvpRepository::delete);
    }
}
