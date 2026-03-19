package com.example.HMS_backend.notification.controller;

import com.example.HMS_backend.notification.dto.NotificationResponse;
import com.example.HMS_backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Get all notifications for the currently authenticated user. */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(Authentication authentication) {
        String username = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");
        return ResponseEntity.ok(notificationService.getNotificationsForUser(username, role));
    }

    /** Get unread notification count for the currently authenticated user. */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        String username = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(username, role)));
    }

    /** Mark a specific notification as read. */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    /** Mark all notifications as read for the current user. */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        String username = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");
        notificationService.markAllReadForUser(username);
        notificationService.markAllReadForRole(role);
        return ResponseEntity.noContent().build();
    }
}
