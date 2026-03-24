package com.example.HMS_backend.encounter.repository;

import com.example.HMS_backend.encounter.entity.Encounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EncounterRepository extends JpaRepository<Encounter, Long> {

    List<Encounter> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<Encounter> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Encounter> findByDoctorIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long doctorId, LocalDateTime start, LocalDateTime end);

    List<Encounter> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    
    @Query("SELECT e.status, COUNT(e) FROM Encounter e GROUP BY e.status")
    List<Object[]> countByStatus();
}
