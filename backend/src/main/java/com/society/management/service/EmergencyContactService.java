package com.society.management.service;

import com.society.management.dto.EmergencyContactRequest;
import com.society.management.dto.EmergencyContactResponse;
import com.society.management.entity.EmergencyContact;
import com.society.management.entity.NotificationType;
import com.society.management.entity.User;
import com.society.management.repository.EmergencyContactRepository;
import com.society.management.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmergencyContactService {

    private final EmergencyContactRepository emergencyContactRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public EmergencyContactService(EmergencyContactRepository emergencyContactRepository,
                                    UserRepository userRepository,
                                    NotificationService notificationService) {
        this.emergencyContactRepository = emergencyContactRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public List<EmergencyContactResponse> getAllContacts() {
        return emergencyContactRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(EmergencyContactResponse::from).collect(Collectors.toList());
    }

    public List<EmergencyContactResponse> getActiveContacts() {
        return emergencyContactRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(EmergencyContactResponse::from).collect(Collectors.toList());
    }

    public EmergencyContactResponse createContact(EmergencyContactRequest request) {
        EmergencyContact contact = EmergencyContact.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .category(request.getCategory())
                .address(request.getAddress())
                .active(request.getActive() != null ? request.getActive() : true)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();
        return EmergencyContactResponse.from(emergencyContactRepository.save(contact));
    }

    public EmergencyContactResponse updateContact(Long id, EmergencyContactRequest request) {
        EmergencyContact contact = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Emergency contact not found"));
        contact.setName(request.getName());
        contact.setPhone(request.getPhone());
        contact.setCategory(request.getCategory());
        contact.setAddress(request.getAddress());
        if (request.getActive() != null) contact.setActive(request.getActive());
        if (request.getDisplayOrder() != null) contact.setDisplayOrder(request.getDisplayOrder());
        return EmergencyContactResponse.from(emergencyContactRepository.save(contact));
    }

    public void deleteContact(Long id) {
        if (!emergencyContactRepository.existsById(id)) {
            throw new RuntimeException("Emergency contact not found");
        }
        emergencyContactRepository.deleteById(id);
    }

    public void triggerSOS(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String unit = user.getUnitNumber() != null ? " (" + user.getUnitNumber() + ")" : "";
        notificationService.createNotificationForAdmins(
                "SOS Alert!",
                "Emergency SOS from " + user.getFullName() + unit + ". Please respond immediately!",
                NotificationType.SOS_ALERT,
                user.getId()
        );
    }
}
