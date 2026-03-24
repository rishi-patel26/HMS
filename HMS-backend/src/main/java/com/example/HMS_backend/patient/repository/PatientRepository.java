package com.example.HMS_backend.patient.repository;

import com.example.HMS_backend.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    @Query("SELECT CAST(p.createdAt AS date) AS day, COUNT(p) FROM Patient p " +
           "WHERE p.createdAt BETWEEN :start AND :end GROUP BY CAST(p.createdAt AS date) ORDER BY day")
    List<Object[]> countByDayBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    Optional<Patient> findByUhid(String uhid);

    Optional<Patient> findByPhone(String phone);

    @Query("SELECT p FROM Patient p WHERE " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "p.uhid LIKE CONCAT('%', :query, '%') OR " +
           "p.phone LIKE CONCAT('%', :query, '%')")
    List<Patient> searchPatients(@Param("query") String query);

    List<Patient> findTop50ByOrderByCreatedAtDesc();


    @Query("SELECT p FROM Patient p WHERE " +
           "p.firstNamePhonetic = :phoneticKey OR " +
           "p.lastNamePhonetic = :phoneticKey OR " +
           "p.fullNamePhonetic = :phoneticKey")
    List<Patient> findByPhoneticKey(@Param("phoneticKey") String phoneticKey);

}
