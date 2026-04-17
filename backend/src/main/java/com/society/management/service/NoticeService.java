package com.society.management.service;

import com.society.management.dto.NoticeRequest;
import com.society.management.dto.NoticeResponse;
import com.society.management.entity.Notice;
import com.society.management.entity.NotificationType;
import com.society.management.entity.User;
import com.society.management.repository.NoticeRepository;
import com.society.management.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public NoticeService(NoticeRepository noticeRepository, UserRepository userRepository,
                         NotificationService notificationService) {
        this.noticeRepository = noticeRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public List<NoticeResponse> getAllNotices() {
        return noticeRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(NoticeResponse::from).collect(Collectors.toList());
    }

    public List<NoticeResponse> getActiveNotices() {
        return noticeRepository.findByActiveTrueAndExpiresAtIsNullOrActiveTrueAndExpiresAtGreaterThanEqualOrderByCreatedAtDesc(LocalDate.now())
                .stream().map(NoticeResponse::from).collect(Collectors.toList());
    }

    public NoticeResponse createNotice(NoticeRequest request, String username) {
        User postedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .priority(request.getPriority())
                .postedBy(postedBy)
                .attachmentUrl(request.getAttachmentUrl())
                .expiresAt(request.getExpiresAt() != null ? LocalDate.parse(request.getExpiresAt()) : null)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Notice saved = noticeRepository.save(notice);

        notificationService.createNotificationForAllUsers(
                "New Notice: " + saved.getTitle(),
                saved.getContent().length() > 100 ? saved.getContent().substring(0, 100) + "..." : saved.getContent(),
                NotificationType.NOTICE_NEW,
                saved.getId()
        );

        return NoticeResponse.from(saved);
    }

    public NoticeResponse updateNotice(Long id, NoticeRequest request) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notice not found"));

        notice.setTitle(request.getTitle());
        notice.setContent(request.getContent());
        notice.setCategory(request.getCategory());
        notice.setPriority(request.getPriority());
        notice.setAttachmentUrl(request.getAttachmentUrl());
        notice.setExpiresAt(request.getExpiresAt() != null ? LocalDate.parse(request.getExpiresAt()) : null);
        if (request.getActive() != null) {
            notice.setActive(request.getActive());
        }

        return NoticeResponse.from(noticeRepository.save(notice));
    }

    public void deleteNotice(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new RuntimeException("Notice not found");
        }
        noticeRepository.deleteById(id);
    }
}
