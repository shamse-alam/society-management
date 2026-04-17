package com.society.management.service;

import com.society.management.dto.ComplaintRequest;
import com.society.management.dto.ComplaintResponse;
import com.society.management.dto.ComplaintUpdateRequest;
import com.society.management.entity.Complaint;
import com.society.management.entity.NotificationType;
import com.society.management.entity.User;
import com.society.management.repository.ComplaintRepository;
import com.society.management.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ComplaintService(ComplaintRepository complaintRepository, UserRepository userRepository,
                            NotificationService notificationService) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public List<ComplaintResponse> getAllComplaints() {
        return complaintRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ComplaintResponse::from).collect(Collectors.toList());
    }

    public List<ComplaintResponse> getMyComplaints(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return complaintRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(ComplaintResponse::from).collect(Collectors.toList());
    }

    public ComplaintResponse createComplaint(ComplaintRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Complaint complaint = Complaint.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .status("OPEN")
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .build();

        return ComplaintResponse.from(complaintRepository.save(complaint));
    }

    public ComplaintResponse updateComplaintStatus(Long id, ComplaintUpdateRequest request) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setStatus(request.getStatus());
        if (request.getAdminRemarks() != null) {
            complaint.setAdminRemarks(request.getAdminRemarks());
        }
        if ("RESOLVED".equals(request.getStatus()) || "CLOSED".equals(request.getStatus())) {
            complaint.setResolvedAt(LocalDateTime.now());
        }

        Complaint saved = complaintRepository.save(complaint);

        notificationService.createNotification(
                complaint.getUser(),
                "Complaint Update: " + complaint.getTitle(),
                "Your complaint status changed to " + request.getStatus(),
                NotificationType.COMPLAINT_UPDATE,
                saved.getId()
        );

        return ComplaintResponse.from(saved);
    }

    public ComplaintResponse uploadAttachment(Long complaintId, MultipartFile file, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        if (!complaint.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to upload attachment for this complaint");
        }

        try {
            Path uploadDir = Paths.get("./uploads/complaints");
            Files.createDirectories(uploadDir);
            String filename = complaintId + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadDir.resolve(filename);
            Files.write(filePath, file.getBytes());
            complaint.setAttachmentUrl("/api/uploads/complaints/" + filename);
            return ComplaintResponse.from(complaintRepository.save(complaint));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload attachment: " + e.getMessage());
        }
    }

    public Map<String, Long> getComplaintStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("OPEN", complaintRepository.countByStatus("OPEN"));
        stats.put("IN_PROGRESS", complaintRepository.countByStatus("IN_PROGRESS"));
        stats.put("RESOLVED", complaintRepository.countByStatus("RESOLVED"));
        stats.put("CLOSED", complaintRepository.countByStatus("CLOSED"));
        return stats;
    }
}
