package com.society.management.service;

import com.society.management.dto.MoveRequestDto;
import com.society.management.dto.MoveRequestResponse;
import com.society.management.entity.*;
import com.society.management.repository.MoveRequestRepository;
import com.society.management.repository.UserRepository;
import com.society.management.repository.PropertyRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class MoveService {

    private final MoveRequestRepository moveRequestRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    public MoveService(MoveRequestRepository moveRequestRepository, UserRepository userRepository, PropertyRepository propertyRepository) {
        this.moveRequestRepository = moveRequestRepository;
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
    }

    public List<MoveRequestResponse> getAllRequests() {
        return moveRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(MoveRequestResponse::from).toList();
    }

    public List<MoveRequestResponse> getRequestsByStatus(String status) {
        return moveRequestRepository.findByStatusOrderByCreatedAtDesc(MoveRequestStatus.valueOf(status))
                .stream().map(MoveRequestResponse::from).toList();
    }

    public List<MoveRequestResponse> getMyRequests(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return moveRequestRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(MoveRequestResponse::from).toList();
    }

    public MoveRequestResponse createRequest(MoveRequestDto req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Property property = propertyRepository.findByUnitNumber(user.getUnitNumber())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        MoveRequest mr = MoveRequest.builder()
                .user(user)
                .property(property)
                .moveType(MoveType.valueOf(req.getMoveType()))
                .scheduledDate(req.getScheduledDate() != null ? LocalDate.parse(req.getScheduledDate()) : null)
                .timeSlot(req.getTimeSlot())
                .vehicleDetails(req.getVehicleDetails())
                .moversCompany(req.getMoversCompany())
                .moversPhone(req.getMoversPhone())
                .notes(req.getNotes())
                .build();
        return MoveRequestResponse.from(moveRequestRepository.save(mr));
    }

    public MoveRequestResponse approveRequest(Long id, Map<String, String> body, String username) {
        MoveRequest mr = moveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Move request not found"));
        User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        mr.setStatus(MoveRequestStatus.APPROVED);
        mr.setApprovedBy(admin);
        if (body != null && body.get("adminRemarks") != null) mr.setAdminRemarks(body.get("adminRemarks"));
        return MoveRequestResponse.from(moveRequestRepository.save(mr));
    }

    public MoveRequestResponse rejectRequest(Long id, Map<String, String> body, String username) {
        MoveRequest mr = moveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Move request not found"));
        User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        mr.setStatus(MoveRequestStatus.REJECTED);
        mr.setApprovedBy(admin);
        if (body != null && body.get("adminRemarks") != null) mr.setAdminRemarks(body.get("adminRemarks"));
        return MoveRequestResponse.from(moveRequestRepository.save(mr));
    }

    public MoveRequestResponse completeRequest(Long id) {
        MoveRequest mr = moveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Move request not found"));
        mr.setStatus(MoveRequestStatus.COMPLETED);
        mr.setNocIssued(true);
        mr.setNocIssuedDate(LocalDate.now());
        return MoveRequestResponse.from(moveRequestRepository.save(mr));
    }
}
