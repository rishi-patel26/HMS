package com.example.HMS_backend.consultation.repository;

import com.example.HMS_backend.consultation.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    @Query("SELECT CAST(c.createdAt AS date) AS day, COUNT(c) FROM Consultation c " +
           "WHERE c.createdAt BETWEEN :start AND :end GROUP BY CAST(c.createdAt AS date) ORDER BY day")
    List<Object[]> countByDayBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    Optional<Consultation> findByEncounterId(Long encounterId);

    List<Consultation> findByCreatedByOrderByCreatedAtDesc(String doctorUsername);

    List<Consultation> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
}
