package com.example.HMS_backend.notification.repository;

import com.example.HMS_backend.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByTargetUserOrderByCreatedAtDesc(String targetUser);

    List<Notification> findByTargetRoleOrderByCreatedAtDesc(String targetRole);

    @Query("SELECT n FROM Notification n WHERE (n.targetUser = :username OR n.targetRole = :role) ORDER BY n.createdAt DESC")
    List<Notification> findByTargetUserOrTargetRole(@Param("username") String username, @Param("role") String role);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id")
    void markAsRead(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.targetUser = :username AND n.isRead = false")
    void markAllReadForUser(@Param("username") String username);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.targetRole = :role AND n.isRead = false")
    void markAllReadForRole(@Param("role") String role);

    long countByTargetUserAndIsReadFalse(String targetUser);

    long countByTargetRoleAndIsReadFalse(String targetRole);
}
