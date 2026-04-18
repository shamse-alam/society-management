package com.society.management.service;

import com.society.management.dto.NotificationResponse;
import com.society.management.entity.Notification;
import com.society.management.entity.NotificationType;
import com.society.management.entity.Role;
import com.society.management.entity.User;
import com.society.management.repository.NotificationRepository;
import com.society.management.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public Notification createNotification(User user, String title, String message, NotificationType type, Long referenceId) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .build();
        return notificationRepository.save(notification);
    }

    public void createNotificationForAllUsers(String title, String message, NotificationType type, Long referenceId) {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> !u.hasRole("GUARD"))
                .collect(Collectors.toList());
        for (User user : users) {
            createNotification(user, title, message, type, referenceId);
        }
    }

    public void createNotificationForAdmins(String title, String message, NotificationType type, Long referenceId) {
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.hasRole("ADMIN"))
                .collect(Collectors.toList());
        for (User admin : admins) {
            createNotification(admin, title, message, type, referenceId);
        }
    }

    public List<NotificationResponse> getMyNotifications(String username, int page) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, 20))
                .getContent().stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    public NotificationResponse markAsRead(Long notificationId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized");
        }
        notification.setRead(true);
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    public void markAllAsRead(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(user.getId());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
