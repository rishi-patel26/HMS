package com.example.HMS_backend.notification.entity;

import com.example.HMS_backend.notification.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    /** Set for user-specific notifications (username). Null if role-based. */
    @Column(length = 100)
    private String targetUser;

    /** Set for role-based notifications (e.g. "FRONTDESK"). Null if user-specific. */
    @Column(length = 50)
    private String targetRole;

    @Builder.Default
    @Column(nullable = false)
    private boolean isRead = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
