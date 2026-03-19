package com.example.HMS_backend.notification.dto;

import com.example.HMS_backend.notification.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String message,
        NotificationType type,
        String targetUser,
        String targetRole,
        boolean isRead,
        LocalDateTime createdAt
) {}
