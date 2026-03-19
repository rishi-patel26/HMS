package com.example.HMS_backend.notification.service;

import com.example.HMS_backend.notification.dto.NotificationResponse;
import com.example.HMS_backend.notification.entity.Notification;
import com.example.HMS_backend.notification.enums.NotificationType;
import com.example.HMS_backend.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /** Store a notification targeted at a specific user (by username). */
    @Transactional
    public void notifyUser(String message, NotificationType type, String username) {
        Notification notification = Notification.builder()
                .message(message)
                .type(type)
                .targetUser(username)
                .build();
        notificationRepository.save(notification);
    }

    /** Store a notification targeted at all users with a specific role (e.g. "FRONTDESK"). */
    @Transactional
    public void notifyRole(String message, NotificationType type, String role) {
        Notification notification = Notification.builder()
                .message(message)
                .type(type)
                .targetRole(role)
                .build();
        notificationRepository.save(notification);
    }

    /** Fetch all notifications for a user (user-specific + role-based). */
    public List<NotificationResponse> getNotificationsForUser(String username, String role) {
        return notificationRepository.findByTargetUserOrTargetRole(username, role)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** Count unread notifications for a user. */
    public long getUnreadCount(String username, String role) {
        return notificationRepository.countByTargetUserAndIsReadFalse(username)
                + notificationRepository.countByTargetRoleAndIsReadFalse(role);
    }

    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.markAsRead(id);
    }

    @Transactional
    public void markAllReadForUser(String username) {
        notificationRepository.markAllReadForUser(username);
    }

    @Transactional
    public void markAllReadForRole(String role) {
        notificationRepository.markAllReadForRole(role);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getMessage(),
                n.getType(),
                n.getTargetUser(),
                n.getTargetRole(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
