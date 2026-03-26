package com.example.HMS_backend.notification.service;

import com.example.HMS_backend.notification.dto.NotificationResponse;
import com.example.HMS_backend.notification.entity.Notification;
import com.example.HMS_backend.notification.enums.NotificationType;
import com.example.HMS_backend.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@RequiredArgsConstructor
@Slf4j
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /** 
     * Store a notification targeted at a specific user (by username).
     * Sends notification to user's dedicated channel: /user/{username}/queue/notifications
     */
    @Transactional
    public void notifyUser(String message, NotificationType type, String username) {
        log.info("Creating notification for user '{}': {}", username, message);
        
        Notification notification = Notification.builder()
                .message(message)
                .type(type)
                .targetUser(username)
                .build();
        Notification saved = notificationRepository.save(notification);
        
        // Send real-time notification via WebSocket to user's dedicated channel
        NotificationResponse response = toResponse(saved);
        String destination = "/queue/notifications";
        messagingTemplate.convertAndSendToUser(username, destination, response);
        
        log.debug("Notification sent to user '{}' on channel '/user/{}/queue/notifications'", username, username);
    }

    /** 
     * Store a notification targeted at all users with a specific role (e.g. "FRONTDESK").
     * Sends notification to role-based channel: /topic/notifications/{role}
     */
    @Transactional
    public void notifyRole(String message, NotificationType type, String role) {
        log.info("Creating notification for role '{}': {}", role, message);
        
        Notification notification = Notification.builder()
                .message(message)
                .type(type)
                .targetRole(role)
                .build();
        Notification saved = notificationRepository.save(notification);
        
        // Send real-time notification via WebSocket to all users with this role
        NotificationResponse response = toResponse(saved);
        String destination = "/topic/notifications/" + role;
        messagingTemplate.convertAndSend(destination, response);
        
        log.debug("Notification sent to role '{}' on channel '{}'", role, destination);
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
